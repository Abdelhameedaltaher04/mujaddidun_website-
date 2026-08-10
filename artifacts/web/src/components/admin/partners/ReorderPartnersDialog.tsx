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
import type { Partner } from '@/services/adminPartners';

interface ReorderPartnersDialogProps {
  partners: Partner[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSave: (ids: number[]) => void;
}

/**
 * Reorder partners with HTML5 drag & drop (desktop) or up/down buttons
 * (keyboard + touch). Saving sends the full id order to the API.
 */
export function ReorderPartnersDialog({
  partners,
  open,
  onOpenChange,
  isSaving,
  onSave,
}: ReorderPartnersDialogProps) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<Partner[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setItems(
        [...partners].sort((a, b) => a.display_order - b.display_order),
      );
      setDragIndex(null);
    }
  }, [open, partners]);

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
        data-testid="dialog-reorder-partners"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.partners.reorderTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.partners.reorderDescription')}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {items.map((partner, index) => {
            const name = locale === 'ar' ? partner.name_ar : partner.name_en;
            return (
              <li
                key={partner.id}
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
                data-testid={`reorder-item-${partner.id}`}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                {partner.logo_url ? (
                  <div className="flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/40 p-0.5">
                    <img
                      src={partner.logo_url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0 || isSaving}
                  onClick={() => move(index, index - 1)}
                  aria-label={t('admin.partners.moveUp')}
                  data-testid={`button-move-up-${partner.id}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === items.length - 1 || isSaving}
                  onClick={() => move(index, index + 1)}
                  aria-label={t('admin.partners.moveDown')}
                  data-testid={`button-move-down-${partner.id}`}
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
            data-testid="button-reorder-cancel"
          >
            {t('admin.partners.cancel')}
          </Button>
          <Button
            onClick={() => onSave(items.map((item) => item.id))}
            disabled={isSaving}
            data-testid="button-reorder-save"
          >
            {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('admin.partners.saveOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
