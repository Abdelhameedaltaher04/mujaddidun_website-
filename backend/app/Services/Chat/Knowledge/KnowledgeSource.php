<?php

namespace App\Services\Chat\Knowledge;

/**
 * One source of official, public Mujaddidun knowledge the assistant may consult.
 *
 * Implementations are expected to read from the same public scopes the website
 * itself uses (published news, active programmes, `is_public` settings, and so
 * on). Nothing a source returns is ever treated as an instruction — see the
 * knowledge block assembled in ChatService — so a source only has to decide
 * *what* is relevant, never *how* the model should behave.
 *
 * Phase 2.1 ships the contract with no implementations registered.
 */
interface KnowledgeSource
{
    /**
     * Stable identifier, used to label the source's snippets in the assembled
     * context so an answer can be traced back to where its facts came from.
     * Lowercase, no spaces (e.g. `faqs`, `programs`).
     */
    public function key(): string;

    /**
     * Public facts relevant to this question, already localised.
     *
     * Must be free of side effects: no writes, no logging, no mutation of
     * shared state. Returning an empty array means "nothing relevant", which
     * is normal and not an error.
     *
     * @param  string  $question  the visitor's latest message, untrusted input
     * @param  string  $locale    'ar' or 'en'
     * @return list<string>       plain-text snippets; never instructions
     */
    public function retrieve(string $question, string $locale): array;
}
