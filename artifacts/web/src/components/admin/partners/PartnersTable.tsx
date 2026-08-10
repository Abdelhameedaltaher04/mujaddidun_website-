import {
  CheckCircle2,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
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
import type { Partner } from '@/services/adminPartners';
import {
  PartnerStatusBadge,
  PartnerTypeBadge,
} from '@/components/admin/partners/partnerBadges';

export interface PartnerActions {
  onView: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onActivate: (partner: Partner) => void;
  onDeactivate: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

interface PartnersTableProps extends PartnerActions {
  partners: Partner[];
}

function PartnerLogo({ partner, alt }: { partner: Partner; alt: string }) {
  if (partner.logo_url) {
    return (
      <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 p-1">
        <img
          src={partner.logo_url}
          alt={alt}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-16 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold text-muted-foreground">
      {alt.charAt(0)}
    </div>
  );
}

function ActionsMenu({
  partner,
  actions,
  idSuffix = '',
}: {
  partner: Partner;
  actions: PartnerActions;
  idSuffix?: string;
}) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-partner-actions-${partner.id}${idSuffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.partners.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(partner)}
          data-testid={`partner-action-view-${partner.id}${idSuffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.partners.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(partner)}
          data-testid={`partner-action-edit-${partner.id}${idSuffix}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.partners.actionEdit')}
        </DropdownMenuItem>
        {partner.status === 'inactive' ? (
          <DropdownMenuItem
            onClick={() => actions.onActivate(partner)}
            data-testid={`partner-action-activate-${partner.id}${idSuffix}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.partners.actionActivate')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => actions.onDeactivate(partner)}
            data-testid={`partner-action-deactivate-${partner.id}${idSuffix}`}
          >
            <XCircle className="me-2 h-4 w-4" />
            {t('admin.partners.actionDeactivate')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(partner)}
          className="text-destructive focus:text-destructive"
          data-testid={`partner-action-delete-${partner.id}${idSuffix}`}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {t('admin.partners.actionDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WebsiteLink({ url }: { url: string | null }) {
  const { t } = useLocale();
  if (!url) {
    return <span className="text-muted-foreground">—</span>;
  }
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* show raw url */
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-[180px] items-center gap-1 truncate text-primary hover:underline"
      aria-label={t('admin.partners.fields.website')}
    >
      <span className="truncate" dir="ltr">
        {host}
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

/** Desktop table (lg+) and mobile/tablet cards for partners. */
export function PartnersTable({ partners, ...actions }: PartnersTableProps) {
  const { t, locale } = useLocale();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const nameOf = (partner: Partner) =>
    locale === 'ar' ? partner.name_ar : partner.name_en;

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.partners.columnLogo')}</TableHead>
              <TableHead>{t('admin.partners.columnName')}</TableHead>
              <TableHead>{t('admin.partners.columnType')}</TableHead>
              <TableHead>{t('admin.partners.columnWebsite')}</TableHead>
              <TableHead className="text-center">
                {t('admin.partners.columnOrder')}
              </TableHead>
              <TableHead>{t('admin.partners.columnStatus')}</TableHead>
              <TableHead>{t('admin.partners.columnCreated')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                <TableCell>
                  <PartnerLogo partner={partner} alt={nameOf(partner)} />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {partner.name_ar}
                  </p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {partner.name_en}
                  </p>
                </TableCell>
                <TableCell>
                  <PartnerTypeBadge type={partner.type} />
                </TableCell>
                <TableCell>
                  <WebsiteLink url={partner.website_url} />
                </TableCell>
                <TableCell className="text-center font-medium">
                  {partner.display_order}
                </TableCell>
                <TableCell>
                  <PartnerStatusBadge status={partner.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(partner.created_at)}
                </TableCell>
                <TableCell>
                  <ActionsMenu partner={partner} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet */}
      <div className="space-y-3 lg:hidden">
        {partners.map((partner) => (
          <Card key={partner.id} data-testid={`card-partner-${partner.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <PartnerLogo partner={partner} alt={nameOf(partner)} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {nameOf(partner)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <PartnerTypeBadge type={partner.type} />
                      <PartnerStatusBadge status={partner.status} />
                    </div>
                  </div>
                </div>
                <ActionsMenu
                  partner={partner}
                  actions={actions}
                  idSuffix="-mobile"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <WebsiteLink url={partner.website_url} />
                <span>
                  {t('admin.partners.orderLabel', {
                    order: String(partner.display_order),
                  })}
                </span>
                <span>{formatDate(partner.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
