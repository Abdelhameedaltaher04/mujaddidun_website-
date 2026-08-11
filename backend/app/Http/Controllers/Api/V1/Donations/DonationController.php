<?php

namespace App\Http\Controllers\Api\V1\Donations;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Donations\ListDonationsRequest;
use App\Http\Resources\Api\V1\Donations\DonationResource;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends BaseController
{
    /** GET /api/v1/donations */
    public function index(ListDonationsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Donation::class);

        $filters = $request->validated();

        $query = Donation::query();

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("donor_name like ? escape '\\'", [$like])
                    ->orWhereRaw("donor_email like ? escape '\\'", [$like])
                    ->orWhereRaw("payment_reference like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $this->dbStatus($filters['status']));
        }

        if (! empty($filters['method'])) {
            $query->where('payment_provider', $filters['method']);
        }

        if ($from = $this->parseDate($filters['date_from'] ?? null)) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $this->parseDate($filters['date_to'] ?? null)) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Donations retrieved successfully.',
            'data' => DonationResource::collection($paginator->items()),
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

    /** GET /api/v1/donations/statistics */
    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', Donation::class);

        $totals = Donation::query()
            ->selectRaw("coalesce(sum(case when status in ('paid', 'pending') then amount else 0 end), 0) as total_amount")
            ->selectRaw("coalesce(sum(case when status = 'paid' then amount else 0 end), 0) as completed_amount")
            ->selectRaw("sum(case when status = 'pending' then 1 else 0 end) as pending_count")
            ->selectRaw('count(distinct coalesce(donor_email, cast(user_id as text), cast(id as text))) as donors_count')
            ->first();

        $thisMonth = Donation::query()
            ->where('status', 'paid')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');

        return $this->success([
            'total_amount' => round((float) $totals->total_amount, 2),
            'completed_amount' => round((float) $totals->completed_amount, 2),
            'pending_count' => (int) $totals->pending_count,
            'donors_count' => (int) $totals->donors_count,
            'this_month_amount' => round((float) $thisMonth, 2),
            'currency' => 'JOD',
        ], 'Donation statistics retrieved successfully.');
    }

    /** GET /api/v1/donations/{donation} */
    public function show(Donation $donation): JsonResponse
    {
        $this->authorize('view', $donation);

        return $this->success(new DonationResource($donation), 'Donation retrieved successfully.');
    }

    /**
     * PATCH /api/v1/donations/{donation}/status — body {status}.
     * Only pending donations can be marked completed or failed.
     */
    public function setStatus(Request $request, Donation $donation): JsonResponse
    {
        $this->authorize('manage', $donation);

        $validated = $request->validate([
            'status' => ['required', 'in:completed,failed'],
        ]);

        return $this->transition(
            $donation,
            allowedFrom: ['pending'],
            to: $this->dbStatus($validated['status']),
            message: 'Only pending donations can be marked as '.$validated['status'].'.',
        );
    }

    /**
     * PATCH /api/v1/donations/{donation}/refund.
     * Only completed donations can be refunded.
     */
    public function refund(Donation $donation): JsonResponse
    {
        $this->authorize('manage', $donation);

        return $this->transition(
            $donation,
            allowedFrom: ['paid'],
            to: 'refunded',
            message: 'Only completed donations can be refunded.',
        );
    }

    /**
     * PATCH /api/v1/donations/{donation}/cancel.
     * Only pending donations can be cancelled.
     */
    public function cancel(Donation $donation): JsonResponse
    {
        $this->authorize('manage', $donation);

        return $this->transition(
            $donation,
            allowedFrom: ['pending'],
            to: 'cancelled',
            message: 'Only pending donations can be cancelled.',
        );
    }

    /**
     * Applies a guarded state transition with a row lock so concurrent
     * admin actions cannot double-apply (e.g. two refunds).
     */
    private function transition(Donation $donation, array $allowedFrom, string $to, string $message): JsonResponse
    {
        $result = DB::transaction(function () use ($donation, $allowedFrom, $to) {
            $fresh = Donation::whereKey($donation->id)->lockForUpdate()->firstOrFail();

            if (! in_array($fresh->status, $allowedFrom, true)) {
                return null;
            }

            $fresh->status = $to;
            if ($to === 'paid' && $fresh->paid_at === null) {
                $fresh->paid_at = now();
            }
            if ($to === 'refunded') {
                $fresh->refunded_at = now();
            }
            $fresh->save();

            return $fresh;
        });

        if ($result === null) {
            return $this->error($message, null, 422);
        }

        return $this->success(new DonationResource($result), 'Donation updated successfully.');
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

    /** Maps the frontend status vocabulary to the database enum. */
    private function dbStatus(string $status): string
    {
        return $status === 'completed' ? 'paid' : $status;
    }
}
