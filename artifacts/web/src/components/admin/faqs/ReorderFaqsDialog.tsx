import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { Faq } from '@/services/adminFaqs';

interface ReorderFaqsDialogProps {
  faqs: Faq[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSave: (ids: number[]) => void;
}

/**
 * Reorder FAQs with HTML5 drag & drop (desktop) or up/down buttons
 * (keyboard + touch). Saving sends the full id order to the API.
 */
export function ReorderFaqsDialog({
  faqs,
  open,
  onOpenChange,
  isSaving,
  onSave,
}: ReorderFaqsDialogProps) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<Faq[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setItems([...faqs].sort((a, b) => a.display_order - b.display_order));
      setDragIndex(null);
    }
  }, [open, faqs]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
        data-testid="dialog-reorder-faqs"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.faqs.reorderTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.faqs.reorderDescription')}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {items.map((faq, index) => {
            const question =
              locale === 'ar' ? faq.question_ar : faq.question_en;
            return (
              <li
                key={faq.id}
                draggable={!isSaving}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    move(dragIndex, index);
                    setDragIndex(index);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-card p-2',
                  dragIndex === index && 'opacity-60 ring-2 ring-primary/40',
                )}
                data-testid={`reorder-faq-item-${faq.id}`}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {question}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0 || isSaving}
                  onClick={() => move(index, index - 1)}
                  aria-label={t('admin.faqs.moveUp')}
                  data-testid={`button-faq-move-up-${faq.id}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === items.length - 1 || isSaving}
                  onClick={() => move(index, index + 1)}
                  aria-label={t('admin.faqs.moveDown')}
                  data-testid={`button-faq-move-down-${faq.id}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-reorder-faqs-cancel"
          >
            {t('admin.faqs.cancel')}
          </Button>
          <Button
            onClick={() => onSave(items.map((item) => item.id))}
            disabled={isSaving}
            data-testid="button-reorder-faqs-save"
          >
            {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('admin.faqs.saveOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
