import { forwardRef, type ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IconInputProps extends ComponentProps<typeof Input> {
  /** Leading icon rendered inside the field (start side, RTL-aware). */
  icon: LucideIcon;
}

/**
 * Input with a leading icon. The icon sits on the logical start side so it
 * flips correctly between RTL (Arabic) and LTR (English) layouts.
 */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon: Icon, className, ...props }, ref) => (
    // Mirror the input's explicit dir (e.g. ltr email/phone fields on RTL
    // pages) so the icon side always matches the input's padding side.
    <div className="relative" dir={props.dir}>
      <span
        className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-muted-foreground/70"
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <Input ref={ref} className={cn('ps-11', className)} {...props} />
    </div>
  ),
);
IconInput.displayName = 'IconInput';
