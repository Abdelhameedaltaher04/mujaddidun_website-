import {
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale } from '@/contexts/LocaleContext';
import type { Donation } from '@/services/adminDonations';
import {
  DonationMethodBadge,
  DonationStatusBadge,
} from '@/components/admin/donations/donationBadges';
import { formatDonationAmount } from '@/components/admin/donations/donationFormat';

export interface DonationActions {
  onView: (donation: Donation) => void;
  onMarkCompleted: (donation: Donation) => void;
  onMarkFailed: (donation: Donation) => void;
  onRefund: (donation: Donation) => void;
  onCancel: (donation: Donation) => void;
}

interface DonationsTableProps extends DonationActions {
  donations: Donation[];
  /** Moderators get read-only access: only View is offered. */
  readOnly: boolean;
}

function ActionsMenu({
  donation,
  actions,
  readOnly,
  idSuffix = '',
}: {
  donation: Donation;
  actions: DonationActions;
  readOnly: boolean;
  idSuffix?: string;
}) {
  const { t } = useLocale();
  const canMark = !readOnly && donation.status === 'pending';
  const canRefund = !readOnly && donation.status === 'completed';
  const canCancel = !readOnly && donation.status === 'pending';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-donation-actions-${donation.id}${idSuffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.donations.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(donation)}
          data-testid={`donation-action-view-${donation.id}${idSuffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.donations.actionView')}
        </DropdownMenuItem>
        {canMark ? (
          <>
            <DropdownMenuItem
              onClick={() => actions.onMarkCompleted(donation)}
              data-testid={`donation-action-complete-${donation.id}${idSuffix}`}
            >
              <CheckCircle2 className="me-2 h-4 w-4" />
              {t('admin.donations.actionMarkCompleted')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onMarkFailed(donation)}
              data-testid={`donation-action-fail-${donation.id}${idSuffix}`}
            >
              <XCircle className="me-2 h-4 w-4" />
              {t('admin.donations.actionMarkFailed')}
            </DropdownMenuItem>
          </>
        ) : null}
        {canRefund || canCancel ? <DropdownMenuSeparator /> : null}
        {canRefund ? (
          <DropdownMenuItem
            onClick={() => actions.onRefund(donation)}
            className="text-destructive focus:text-destructive"
            data-testid={`donation-action-refund-${donation.id}${idSuffix}`}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t('admin.donations.actionRefund')}
          </DropdownMenuItem>
        ) : null}
        {canCancel ? (
          <DropdownMenuItem
            onClick={() => actions.onCancel(donation)}
            className="text-destructive focus:text-destructive"
            data-testid={`donation-action-cancel-${donation.id}${idSuffix}`}
          >
            <Ban className="me-2 h-4 w-4" />
            {t('admin.donations.actionCancel')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop table (lg+) and mobile/tablet cards for donations. */
export function DonationsTable({
  donations,
  readOnly,
  ...actions
}: DonationsTableProps) {
  const { t, locale } = useLocale();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.donations.columnDonor')}</TableHead>
              <TableHead>{t('admin.donations.columnAmount')}</TableHead>
              <TableHead>{t('admin.donations.columnMethod')}</TableHead>
              <TableHead>{t('admin.donations.columnTransaction')}</TableHead>
              <TableHead>{t('admin.donations.columnStatus')}</TableHead>
              <TableHead>{t('admin.donations.columnDate')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow
                key={donation.id}
                data-testid={`row-donation-${donation.id}`}
              >
                <TableCell className="max-w-[220px]">
                  <p className="truncate font-medium text-foreground">
                    {donation.donor_name}
                  </p>
                  <p
                    className="truncate text-sm text-muted-foreground"
                    dir="ltr"
                  >
                    {donation.email}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  <span dir="ltr">
                    {formatDonationAmount(
                      donation.amount,
                      donation.currency,
                      locale,
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <DonationMethodBadge method={donation.method} />
                </TableCell>
                <TableCell>
                  <span
                    className="font-mono text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {donation.transaction_id}
                  </span>
                </TableCell>
                <TableCell>
                  <DonationStatusBadge status={donation.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(donation.donated_at)}
                </TableCell>
                <TableCell>
                  <ActionsMenu
                    donation={donation}
                    actions={actions}
                    readOnly={readOnly}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet */}
      <div className="space-y-3 lg:hidden">
        {donations.map((donation) => (
          <Card
            key={donation.id}
            data-testid={`card-donation-${donation.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {donation.donor_name}
                  </p>
                  <p
                    className="truncate text-sm text-muted-foreground"
                    dir="ltr"
                  >
                    {donation.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <DonationStatusBadge status={donation.status} />
                    <DonationMethodBadge method={donation.method} />
                  </div>
                </div>
                <ActionsMenu
                  donation={donation}
                  actions={actions}
                  readOnly={readOnly}
                  idSuffix="-mobile"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-foreground" dir="ltr">
                  {formatDonationAmount(
                    donation.amount,
                    donation.currency,
                    locale,
                  )}
                </span>
                <span className="text-muted-foreground">
                  {formatDate(donation.donated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
