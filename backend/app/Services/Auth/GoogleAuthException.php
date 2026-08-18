<?php

namespace App\Services\Auth;

use RuntimeException;

/**
 * Carries a stable, non-sensitive reason code that the frontend can translate.
 * The message never contains provider responses, tokens or credentials.
 */
class GoogleAuthException extends RuntimeException
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
