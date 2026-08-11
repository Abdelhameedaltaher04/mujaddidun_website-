<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\ContactMessage;
use App\Models\Donation;
use App\Models\Event;
use App\Models\News;
use App\Models\Program;
use App\Models\User;
use App\Models\VolunteerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Real admin dashboard statistics computed from the live database.
 * Admin-only: unauthenticated 401 (route middleware), non-admin 403.
 */
class DashboardController extends BaseController
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        abort_unless($user && $user->role?->slug === 'admin', 403, 'Only administrators can view dashboard statistics.');
    }

    /** GET /admin/dashboard/statistics */
    public function statistics(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $now = now();
        $periodStart = $now->copy()->subDays(30);
        $previousStart = $now->copy()->subDays(60);

        $trend = function ($query) use ($periodStart, $previousStart, $now): int {
            $current = (clone $query)->whereBetween('created_at', [$periodStart, $now])->count();
            $previous = (clone $query)->whereBetween('created_at', [$previousStart, $periodStart])->count();
            if ($previous === 0) {
                return $current > 0 ? 100 : 0;
            }

            return (int) round((($current - $previous) / $previous) * 100);
        };

        $stats = [
            ['key' => 'users', 'value' => User::count(), 'trend' => $trend(User::query())],
            ['key' => 'news', 'value' => News::where('status', 'published')->count(), 'trend' => $trend(News::where('status', 'published'))],
            ['key' => 'events', 'value' => Event::count(), 'trend' => $trend(Event::query())],
            ['key' => 'programs', 'value' => Program::count(), 'trend' => $trend(Program::query())],
            ['key' => 'volunteerApplications', 'value' => VolunteerApplication::count(), 'trend' => $trend(VolunteerApplication::query())],
            // The dashboard renders this stat as a currency amount, so the
            // trend must also compare amounts (not row counts) and use the
            // business event timestamp (paid_at).
            ['key' => 'donations', 'value' => (float) Donation::where('status', 'paid')->sum('amount'), 'trend' => $this->amountTrend($periodStart, $previousStart, $now)],
            ['key' => 'contactMessages', 'value' => ContactMessage::count(), 'trend' => $trend(ContactMessage::query())],
            ['key' => 'unreadMessages', 'value' => ContactMessage::whereNull('read_at')->count(), 'trend' => $trend(ContactMessage::whereNull('read_at'))],
        ];

        return $this->success($stats, 'Dashboard statistics retrieved successfully.');
    }

    private function amountTrend(Carbon $periodStart, Carbon $previousStart, Carbon $now): int
    {
        $current = (float) Donation::where('status', 'paid')
            ->whereBetween('paid_at', [$periodStart, $now])->sum('amount');
        $previous = (float) Donation::where('status', 'paid')
            ->whereBetween('paid_at', [$previousStart, $periodStart])->sum('amount');
        if ($previous == 0.0) {
            return $current > 0 ? 100 : 0;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    /** GET /admin/dashboard/charts */
    public function charts(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $months = collect(range(5, 0))
            ->map(fn (int $back) => now()->startOfMonth()->subMonths($back));
        $windowStart = $months->first();

        // One grouped aggregate query per series (SQLite month bucketing),
        // then the six-month window is filled in from the grouped rows.
        $series = function ($query, string $column, ?string $sum = null) use ($months, $windowStart): array {
            $expression = $sum ? "SUM({$sum})" : 'COUNT(*)';
            $rows = (clone $query)
                ->where($column, '>=', $windowStart)
                ->selectRaw("strftime('%Y-%m', {$column}) as bucket, {$expression} as total")
                ->groupBy('bucket')
                ->pluck('total', 'bucket');

            return $months->map(fn (Carbon $month) => [
                'date' => $month->toDateString(),
                'value' => $sum
                    ? (float) ($rows[$month->format('Y-m')] ?? 0)
                    : (int) ($rows[$month->format('Y-m')] ?? 0),
            ])->all();
        };

        return $this->success([
            'usersGrowth' => $series(User::query(), 'created_at'),
            // Donations bucket by when the payment completed, not row creation.
            'donations' => $series(Donation::where('status', 'paid'), 'paid_at', 'amount'),
            'activity' => [
                'events' => $series(Event::query(), 'created_at'),
                'volunteers' => $series(VolunteerApplication::query(), 'created_at'),
            ],
        ], 'Dashboard chart data retrieved successfully.');
    }

    /** GET /admin/dashboard/activities */
    public function activities(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $items = collect()
            ->concat(User::latest('created_at')->limit(5)->get()->map(fn ($u) => [
                'id' => $u->id, 'type' => 'user_registered',
                'occurred_at' => $u->created_at?->toISOString(),
                'status' => $u->status === 'pending' ? 'pending' : 'approved',
            ]))
            ->concat(News::where('status', 'published')->latest('published_at')->limit(5)->get()->map(fn ($n) => [
                'id' => $n->id, 'type' => 'news_published',
                'occurred_at' => ($n->published_at ?? $n->created_at)?->toISOString(),
                'status' => 'completed',
            ]))
            ->concat(Event::latest('created_at')->limit(5)->get()->map(fn ($e) => [
                'id' => $e->id, 'type' => 'event_created',
                'occurred_at' => $e->created_at?->toISOString(),
                'status' => 'completed',
            ]))
            ->concat(VolunteerApplication::latest('created_at')->limit(5)->get()->map(fn ($a) => [
                'id' => $a->id, 'type' => 'volunteer_applied',
                'occurred_at' => ($a->submitted_at ?? $a->created_at)?->toISOString(),
                'status' => match ($a->status) {
                    'approved' => 'approved',
                    'submitted', 'under_review' => 'pending',
                    default => 'completed',
                },
            ]))
            ->concat(Donation::latest('created_at')->limit(5)->get()->map(fn ($d) => [
                'id' => $d->id, 'type' => 'donation_received',
                'occurred_at' => $d->created_at?->toISOString(),
                'status' => $d->status === 'paid' ? 'completed' : 'pending',
            ]))
            ->filter(fn ($item) => $item['occurred_at'] !== null)
            ->sortByDesc('occurred_at')
            ->values()
            ->take(10);

        return $this->success($items->all(), 'Recent activity retrieved successfully.');
    }
}
