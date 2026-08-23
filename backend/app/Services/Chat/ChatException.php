<?php

namespace App\Services\Chat;

use RuntimeException;

/**
 * Carries a stable, non-sensitive reason code the frontend can translate.
 *
 * Provider messages are never placed in here: they can echo back the caller's
 * own text or internal request details, and this value reaches the browser.
 */
class ChatException extends RuntimeException
{
    public function __construct(private readonly string $reason)
    {
        parent::__construct($reason);
    }

    public function reason(): string
    {
        return $this->reason;
    }
}
