import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import type { Partner } from '@/services/adminPartners';
import {
  PartnerStatusBadge,
  PartnerTypeBadge,
} from '@/components/admin/partners/partnerBadges';

interface PartnerPreviewDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shows the partner as it appears on the public website — mirrors the
 * public partners carousel card (logo or circular initial + name).
 */
export function PartnerPreviewDialog({
  partner,
  open,
  onOpenChange,
}: PartnerPreviewDialogProps) {
  const { t, locale } = useLocale();
  if (!partner) return null;
  const name = locale === 'ar' ? partner.name_ar : partner.name_en;
  const description =
    locale === 'ar' ? partner.description_ar : partner.description_en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-partner-preview">
        <DialogHeader>
          <DialogTitle>{t('admin.partners.previewTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.partners.previewDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Public carousel card replica */}
        <div className="rounded-xl bg-muted/40 p-6">
          <div className="mx-auto flex w-56 flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
            {partner.logo_url ? (
              <div className="flex h-20 w-full items-center justify-center">
                <img
                  src={partner.logo_url}
                  alt={name}
                  className="max-h-full max-w-full object-contain"
                  data-testid="img-preview-logo"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {name.charAt(0)}
              </div>
            )}
            <span
              className="text-center text-sm font-medium text-foreground"
              data-testid="text-preview-name"
            >
              {name}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <PartnerTypeBadge type={partner.type} />
            <PartnerStatusBadge status={partner.status} />
            <span className="text-muted-foreground">
              {t('admin.partners.orderLabel', {
                order: String(partner.display_order),
              })}
            </span>
          </div>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
          {partner.website_url ? (
            <a
              href={partner.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-primary hover:underline"
              dir="ltr"
            >
              {partner.website_url}
            </a>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
