<?php

namespace App\Http\Controllers\Api\V1\Chat;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Chat\SendChatMessageRequest;
use App\Services\Chat\ChatException;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;

class ChatController extends BaseController
{
    public function __construct(private readonly ChatService $chatService)
    {
    }

    /** POST /api/v1/public/chat — unauthenticated, rate limited. */
    public function send(SendChatMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $reply = $this->chatService->reply(
                $validated['messages'],
                $validated['locale'] ?? 'ar',
            );
        } catch (ChatException $exception) {
            // The reason code is a fixed, non-sensitive string the frontend
            // translates; no provider detail reaches the client.
            return $this->error(
                'The assistant is unavailable right now.',
                ['code' => [$exception->reason()]],
                503,
            );
        }

        return $this->success(['reply' => $reply], 'Reply generated.');
    }
}
