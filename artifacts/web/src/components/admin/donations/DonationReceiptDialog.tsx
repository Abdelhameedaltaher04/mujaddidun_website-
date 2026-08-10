import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
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
import type { Donation } from '@/services/adminDonations';
import { formatDonationAmount } from '@/components/admin/donations/donationFormat';
import logoUrl from '@/assets/mujaddidun-logo.png';

interface DonationReceiptDialogProps {
  donation: Donation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Client-side donation receipt preview with Print / Download.
 * Laravel will later expose GET /donations/{id}/receipt returning the
 * official generated PDF; this view mirrors the intended layout.
 */
export function DonationReceiptDialog({
  donation,
  open,
  onOpenChange,
}: DonationReceiptDialogProps) {
  const { t, locale, dir } = useLocale();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!donation) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  /** HTML-escape dynamic values before interpolating into the document. */
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const buildDocument = () => {
    // Receipt body is taken from the React-rendered (already escaped) DOM.
    const content = receiptRef.current?.innerHTML ?? '';
    return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}" dir="${dir === 'rtl' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(`${t('admin.donations.receiptTitle')} - ${donation.transaction_id}`)}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 32px; color: #0f172a; }
  .receipt { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; }
  img { max-height: 64px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  td { padding: 8px 0; font-size: 14px; vertical-align: top; }
  td:first-child { color: #64748b; }
  td:last-child { text-align: ${dir === 'rtl' ? 'left' : 'right'}; font-weight: 600; }
  h1 { font-size: 18px; margin: 12px 0 0; }
  .header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
  .footer { margin-top: 24px; text-align: center; color: #64748b; font-size: 12px; }
</style>
</head>
<body><div class="receipt">${content}</div></body>
</html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=640,height=800');
    if (!printWindow) return;
    printWindow.document.write(buildDocument());
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([buildDocument()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `receipt-${donation.transaction_id}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
        data-testid="dialog-donation-receipt"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.donations.receiptTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.donations.receiptDescription')}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={receiptRef}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="header border-b border-border pb-4 text-center">
            <img
              src={logoUrl}
              alt={t('admin.donations.associationName')}
              className="mx-auto h-16 w-auto object-contain"
              data-testid="img-receipt-logo"
            />
            <h1 className="mt-3 text-lg font-bold text-foreground">
              {t('admin.donations.associationName')}
            </h1>
          </div>
          <table className="mt-4 w-full">
            <tbody>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.donor')}
                </td>
                <td className="py-2 text-end text-sm font-semibold">
                  {donation.donor_name}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.amount')}
                </td>
                <td className="py-2 text-end text-sm font-semibold" dir="ltr">
                  {formatDonationAmount(
                    donation.amount,
                    donation.currency,
                    locale,
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.currency')}
                </td>
                <td className="py-2 text-end text-sm font-semibold" dir="ltr">
                  {donation.currency}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.transaction')}
                </td>
                <td className="py-2 text-end text-sm font-semibold" dir="ltr">
                  {donation.transaction_id}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.date')}
                </td>
                <td className="py-2 text-end text-sm font-semibold">
                  {formatDate(donation.donated_at)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-muted-foreground">
                  {t('admin.donations.fields.status')}
                </td>
                <td className="py-2 text-end text-sm font-semibold">
                  {t(`admin.donations.statuses.${donation.status}`)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="footer mt-6 text-center text-xs text-muted-foreground">
            {t('admin.donations.receiptFooter')}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            data-testid="button-receipt-download"
          >
            <Download className="me-1.5 h-4 w-4" />
            {t('admin.donations.downloadReceipt')}
          </Button>
          <Button onClick={handlePrint} data-testid="button-receipt-print">
            <Printer className="me-1.5 h-4 w-4" />
            {t('admin.donations.printReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
