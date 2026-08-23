<?php

namespace App\Services\Chat;

/**
 * The single call the chat assistant makes to an AI provider.
 *
 * Kept as a seam so ChatService's own logic — system prompt, guards, error
 * mapping — stays under test without any network access, and so swapping
 * providers later does not touch ChatService.
 */
interface ChatCompletionProvider
{
    /**
     * @param  list<array{role: string, content: string}>  $messages
     *
     * @throws ChatException on any provider failure
     */
    public function complete(string $systemPrompt, array $messages): string;
}
