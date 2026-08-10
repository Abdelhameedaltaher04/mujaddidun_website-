import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import type { TimeSeriesPoint } from '@/services/adminDashboard';

export interface ChartSeries {
  /** Key used in the merged data rows and the chart config. */
  id: string;
  label: string;
  data: TimeSeriesPoint[];
  /** CSS color, defaults to the primary chart token. */
  color?: string;
}

interface TimeSeriesChartProps {
  title: string;
  description?: string;
  series: ChartSeries[];
  variant?: 'area' | 'bar';
  /** Formats tooltip/axis values (e.g. currency). */
  valueFormatter?: (value: number) => string;
  testId: string;
}

/**
 * Reusable time-series chart card (area or bar) for the admin dashboard.
 * Accepts one or more series with ISO dates; month labels follow the
 * active locale. The plot area itself stays LTR (time flows left→right)
 * which is the convention for charts even in RTL interfaces.
 */
export function TimeSeriesChart({
  title,
  description,
  series,
  variant = 'area',
  valueFormatter,
  testId,
}: TimeSeriesChartProps) {
  const { locale } = useLocale();

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-US', { month: 'short' }),
    [locale],
  );

  /** Merge all series into recharts rows keyed by date. */
  const rows = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const s of series) {
      for (const point of s.data) {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[s.id] = point.value;
        byDate.set(point.date, row);
      }
    }
    return [...byDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [series]);

  const config = useMemo(() => {
    const entries: ChartConfig = {};
    series.forEach((s, index) => {
      entries[s.id] = {
        label: s.label,
        color: s.color ?? `hsl(var(--chart-${index + 1}))`,
      };
    });
    return entries;
  }, [series]);

  const ChartComponent = variant === 'bar' ? BarChart : AreaChart;

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ChartContainer config={config} className="h-64 w-full">
            <ChartComponent data={rows} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  monthFormatter.format(new Date(value))
                }
              />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  valueFormatter ? valueFormatter(value) : String(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) =>
                      monthFormatter.format(new Date(value))
                    }
                  />
                }
              />
              {series.map((s) =>
                variant === 'bar' ? (
                  <Bar
                    key={s.id}
                    dataKey={s.id}
                    fill={`var(--color-${s.id})`}
                    radius={[4, 4, 0, 0]}
                  />
                ) : (
                  <Area
                    key={s.id}
                    dataKey={s.id}
                    type="monotone"
                    stroke={`var(--color-${s.id})`}
                    fill={`var(--color-${s.id})`}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ),
              )}
            </ChartComponent>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** Loading placeholder matching TimeSeriesChart dimensions. */
export function TimeSeriesChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
