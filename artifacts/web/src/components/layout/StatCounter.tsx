import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { cn } from '@/lib/utils';

interface StatCounterProps {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
  colorClass?: string;
}

/**
 * A single statistic that counts up from 0 to its target value once it
 * scrolls into view, with an easeOutCubic curve. Renders the final value
 * immediately when the user prefers reduced motion.
 */
export function StatCounter({
  target,
  suffix = '',
  label,
  duration = 2000,
  colorClass = 'text-primary',
}: StatCounterProps) {
  const { ref, value } = useAnimatedCounter<HTMLDivElement>(target, { duration });

  return (
    <div ref={ref} className="text-center space-y-2">
      <div
        className={cn(
          'text-3xl md:text-5xl font-display font-bold tabular-nums',
          colorClass,
        )}
      >
        {value}
        {suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}
