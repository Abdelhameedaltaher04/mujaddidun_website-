import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import type { Donation } from '@/services/adminDonations';
import {
  DonationMethodBadge,
  DonationStatusBadge,
} from '@/components/admin/donations/donationBadges';
import { formatDonationAmount } from '@/components/admin/donations/donationFormat';

interface DonationDetailsDialogProps {
  donation: Donation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowReceipt: (donation: Donation) => void;
}

function DetailRow({
  label,
  children,
  ltr,
}: {
  label: string;
  children: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span
        className="min-w-0 break-words text-end text-sm font-medium text-foreground"
        dir={ltr ? 'ltr' : undefined}
      >
        {children}
      </span>
    </div>
  );
}

/** Full donation details with a shortcut to the printable receipt. */
export function DonationDetailsDialog({
  donation,
  open,
  onOpenChange,
  onShowReceipt,
}: DonationDetailsDialogProps) {
  const { t, locale } = useLocale();
  if (!donation) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
        data-testid="dialog-donation-details"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.donations.detailsTitle')}</DialogTitle>
        </DialogHeader>

        <div className="divide-y divide-border">
          <DetailRow label={t('admin.donations.fields.donor')}>
            {donation.donor_name}
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.email')} ltr>
            {donation.email}
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.phone')} ltr>
            {donation.phone ?? '—'}
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.amount')} ltr>
            {formatDonationAmount(donation.amount, donation.currency, locale)}
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.currency')} ltr>
            {donation.currency}
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.method')}>
            <DonationMethodBadge method={donation.method} />
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.transaction')} ltr>
            <span className="font-mono text-xs">{donation.transaction_id}</span>
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.status')}>
            <DonationStatusBadge status={donation.status} />
          </DetailRow>
          <DetailRow label={t('admin.donations.fields.date')}>
            {formatDate(donation.donated_at)}
          </DetailRow>
        </div>

        {donation.notes ? (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.donations.fields.notes')}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                {donation.notes}
              </p>
            </div>
          </>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-donation-details-close"
          >
            {t('admin.donations.close')}
          </Button>
          <Button
            onClick={() => onShowReceipt(donation)}
            data-testid="button-donation-show-receipt"
          >
            <Receipt className="me-1.5 h-4 w-4" />
            {t('admin.donations.viewReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
