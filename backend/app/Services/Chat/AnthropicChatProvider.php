<?php

namespace App\Services\Chat;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIStatusException;
use Illuminate\Support\Facades\Log;

/**
 * Anthropic implementation of the chat completion call.
 *
 * The API key is read from config (never env() at runtime, so `config:cache`
 * cannot blank it) and never leaves this class.
 */
class AnthropicChatProvider implements ChatCompletionProvider
{
    /** Replies are short by design; this also bounds the cost of a public endpoint. */
    private const MAX_TOKENS = 1024;

    public function complete(string $systemPrompt, array $messages): string
    {
        $apiKey = (string) config('services.anthropic.api_key');

        if ($apiKey === '') {
            // Not an error worth alarming on — the feature is simply not
            // configured on this environment.
            throw new ChatException('ai_not_configured');
        }

        try {
            $message = (new Client(apiKey: $apiKey))->messages->create(
                model: (string) config('services.anthropic.model', 'claude-opus-5'),
                maxTokens: self::MAX_TOKENS,
                system: $systemPrompt,
                messages: $messages,
                // A support answer is a simple task: low effort keeps latency
                // and cost down while leaving adaptive thinking on (disabling
                // thinking entirely can leak internal tags into the reply).
                outputConfig: ['effort' => 'low'],
            );
        } catch (APIStatusException $exception) {
            Log::warning('Chat provider returned an error.', [
                'type' => $exception->type?->value,
                'exception' => $exception::class,
            ]);

            throw new ChatException('ai_unavailable');
        } catch (\Throwable $exception) {
            // Network failure, TLS problem, malformed response.
            Log::warning('Chat provider call failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            throw new ChatException('ai_unavailable');
        }

        // A refusal is a valid HTTP 200 with no usable text — treat it as an
        // ordinary "cannot help with that" rather than an error.
        if ($message->stopReason === 'refusal') {
            throw new ChatException('ai_declined');
        }

        // content is a list of polymorphic blocks; only text blocks are usable.
        $text = '';
        foreach ($message->content as $block) {
            if (($block->type ?? null) === 'text') {
                $text .= $block->text;
            }
        }

        $text = trim($text);

        if ($text === '') {
            throw new ChatException('ai_empty_response');
        }

        return $text;
    }
}
