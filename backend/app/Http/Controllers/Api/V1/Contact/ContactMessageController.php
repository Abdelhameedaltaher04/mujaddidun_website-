<?php

namespace App\Http\Controllers\Api\V1\Contact;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Contact\ListContactMessagesRequest;
use App\Http\Requests\Api\V1\Contact\ReplyToMessageRequest;
use App\Http\Requests\Api\V1\Contact\SetMessageReadRequest;
use App\Http\Requests\Api\V1\Contact\SetMessageStatusRequest;
use App\Http\Resources\Api\V1\Contact\ContactMessageResource;
use App\Mail\ContactMessageReplyMail;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactMessageController extends BaseController
{
    public function index(ListContactMessagesRequest $request): JsonResponse
    {
        $this->authorize('viewAny', ContactMessage::class);

        $filters = $request->validated();

        $query = ContactMessage::query()->latest('created_at')->latest('id');

        if (! empty($filters['search'])) {
            $escaped = addcslashes($filters['search'], '\\%_');
            $like = "%{$escaped}%";
            // SQLite requires an explicit ESCAPE clause for escaped LIKE.
            $query->where(function ($inner) use ($like): void {
                $inner->whereRaw("name LIKE ? ESCAPE '\\'", [$like])
                    ->orWhereRaw("email LIKE ? ESCAPE '\\'", [$like])
                    ->orWhereRaw("subject LIKE ? ESCAPE '\\'", [$like]);
            });
        }

        if (array_key_exists('read', $filters) && $filters['read'] !== null) {
            $filters['read']
                ? $query->whereNotNull('read_at')
                : $query->whereNull('read_at');
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if ($from = $this->parseDate($filters['date_from'] ?? null)) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $this->parseDate($filters['date_to'] ?? null)) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query->paginate(
            perPage: (int) ($filters['per_page'] ?? 10),
            page: (int) ($filters['page'] ?? 1),
        );

        return response()->json([
            'success' => true,
            'message' => 'Request completed successfully.',
            'data' => ContactMessageResource::collection($paginator->items())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ContactMessage::class);

        return $this->success([
            'total' => ContactMessage::count(),
            'unread' => ContactMessage::whereNull('read_at')->count(),
            'in_progress' => ContactMessage::where('status', 'in_progress')->count(),
            'resolved' => ContactMessage::where('status', 'resolved')->count(),
        ]);
    }

    public function show(ContactMessage $message): JsonResponse
    {
        $this->authorize('view', $message);

        return $this->success(new ContactMessageResource($message));
    }

    public function setRead(SetMessageReadRequest $request, ContactMessage $message): JsonResponse
    {
        $this->authorize('manage', $message);

        $isRead = $request->validated('is_read');

        $message->forceFill([
            'read_at' => $isRead ? ($message->read_at ?? now()) : null,
        ])->save();

        return $this->success(
            new ContactMessageResource($message->fresh()),
            $isRead ? 'Message marked as read.' : 'Message marked as unread.',
        );
    }

    public function setStatus(SetMessageStatusRequest $request, ContactMessage $message): JsonResponse
    {
        $this->authorize('manage', $message);

        $target = $request->validated('status');

        $result = $this->transition($message, $target);
        if ($result !== true) {
            return $this->error($result, null, 422);
        }

        return $this->success(
            new ContactMessageResource($message->fresh()),
            'Message status updated successfully.',
        );
    }

    public function archive(ContactMessage $message): JsonResponse
    {
        $this->authorize('manage', $message);

        $result = $this->transition($message, 'archived');
        if ($result !== true) {
            return $this->error($result, null, 422);
        }

        return $this->success(
            new ContactMessageResource($message->fresh()),
            'Message archived successfully.',
        );
    }

    public function destroy(ContactMessage $message): JsonResponse
    {
        $this->authorize('delete', $message);

        $message->delete();

        return $this->success(null, 'Message deleted successfully.');
    }

    public function reply(ReplyToMessageRequest $request, ContactMessage $message): JsonResponse
    {
        $this->authorize('manage', $message);

        $subject = trim($request->validated('subject'));

        // Sanitize the rich-text body before both mailing and persisting
        // (strict allowlist; strips scripts, event handlers, iframes...).
        $bodyHtml = app(\App\Support\ReplyHtmlSanitizer::class)
            ->sanitize($request->validated('body_html'));

        if ($bodyHtml === '') {
            return $this->error('Validation failed.', ['body_html' => ['The reply body must contain visible content.']], 422);
        }

        try {
            Mail::to($message->email)->send(new ContactMessageReplyMail($subject, $bodyHtml));
        } catch (\Throwable $exception) {
            Log::error('Contact reply email failed to send.', [
                'contact_message_id' => $message->id,
                'error' => $exception->getMessage(),
            ]);

            return $this->error(
                'The reply email could not be sent. Please check the mail configuration and try again.',
                null,
                502,
            );
        }

        // Only record the reply (message history) once the send succeeded.
        DB::transaction(function () use ($message, $request, $subject, $bodyHtml): void {
            $message->replies()->create([
                'sender_id' => $request->user()->id,
                'subject' => $subject,
                'body_html' => $bodyHtml,
                'sent_at' => now(),
            ]);

            $message->forceFill([
                'replied_at' => now(),
                'read_at' => $message->read_at ?? now(),
                // Replying to a fresh message implies it is being handled.
                'status' => $message->status === 'new' ? 'in_progress' : $message->status,
            ])->save();
        });

        return $this->success(null, 'Reply sent successfully.');
    }

    /**
     * Applies a status transition under a row lock. Returns true on
     * success or a human-readable error string on an invalid transition.
     * Valid: new/in_progress/resolved may move to any other non-identical
     * state (incl. archived); archived is final (unarchive not offered).
     */
    private function transition(ContactMessage $message, string $target): bool|string
    {
        return DB::transaction(function () use ($message, $target) {
            $locked = ContactMessage::query()->lockForUpdate()->findOrFail($message->id);

            if ($locked->status === 'archived') {
                return 'Archived messages can no longer change status.';
            }

            if ($locked->status === $target) {
                return "The message is already '{$target}'.";
            }

            $locked->forceFill(['status' => $target])->save();

            return true;
        });
    }

    /**
     * Returns the value when it is a complete, valid Y-m-d date, else
     * null (mid-typing values from native date inputs are ignored).
     */
    private function parseDate(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return ($parsed && $parsed->format('Y-m-d') === $value) ? $value : null;
    }
}
