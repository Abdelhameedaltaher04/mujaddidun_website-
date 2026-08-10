<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Safety fuse: the feature suite uses RefreshDatabase, which rebuilds
     * the schema from scratch. If the test process is ever connected to a
     * real database file instead of the in-memory one from phpunit.xml,
     * abort immediately instead of wiping live data.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($database !== ':memory:') {
            self::fail(
                "Refusing to run tests against a non in-memory database ({$connection}: {$database}). ".
                'Check phpunit.xml env overrides before re-running.'
            );
        }
    }
}
