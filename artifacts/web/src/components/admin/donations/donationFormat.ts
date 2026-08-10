/** Shared currency formatting for the donations admin UI. */
export function formatDonationAmount(
  amount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}
