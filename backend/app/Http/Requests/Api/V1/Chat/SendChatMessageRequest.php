<?php

namespace App\Http\Requests\Api\V1\Chat;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Contracts\Validation\Validator;

class SendChatMessageRequest extends ApiFormRequest
{
    /** Caps that bound the cost of an unauthenticated endpoint. */
    public const MAX_MESSAGES = 21;

    public const MAX_CONTENT_LENGTH = 2000;

    public function rules(): array
    {
        return [
            'messages' => ['required', 'array', 'min:1', 'max:'.self::MAX_MESSAGES],
            // `system` is deliberately not accepted: the instructions are built
            // server-side, and letting a caller supply that role would be a
            // prompt-injection channel.
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:'.self::MAX_CONTENT_LENGTH],
            'locale' => ['sometimes', 'string', 'in:ar,en'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var array<int, array{role?: string}>|null $messages */
            $messages = $this->input('messages');

            if (! is_array($messages) || $messages === []) {
                return;
            }

            $last = end($messages);

            if (! is_array($last) || ($last['role'] ?? null) !== 'user') {
                // The provider requires the conversation to end on a user turn.
                $validator->errors()->add('messages', 'The last message must be from the user.');
            }
        });
    }
}
