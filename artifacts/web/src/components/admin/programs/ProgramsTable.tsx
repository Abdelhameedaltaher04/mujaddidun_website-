import {
  Archive,
  CheckCircle2,
  Eye,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
  Users,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminProgram } from '@/services/adminPrograms';
import { ProgramCategoryBadge, ProgramStatusBadge } from './programBadges';

function Thumb({ program }: { program: AdminProgram }) {
  return program.image_url ? (
    <img
      src={program.image_url}
      alt=""
      className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
    />
  ) : (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageOff className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export interface ProgramRowActions {
  onView: (program: AdminProgram) => void;
  onEdit: (program: AdminProgram) => void;
  onActivate: (program: AdminProgram) => void;
  onDeactivate: (program: AdminProgram) => void;
  onArchive: (program: AdminProgram) => void;
  onParticipants: (program: AdminProgram) => void;
  onDelete: (program: AdminProgram) => void;
}

function RowActionsMenu({
  program,
  actions,
  variant,
}: {
  program: AdminProgram;
  actions: ProgramRowActions;
  /** Keeps test ids unique between the table and card render paths. */
  variant: 'desktop' | 'mobile';
}) {
  const { t } = useLocale();
  const suffix = variant === 'mobile' ? '-mobile' : '';
  /** Activate from draft/archived; deactivate only an active program. */
  const canActivate =
    program.status === 'draft' || program.status === 'archived';
  const canDeactivate = program.status === 'active';
  const canArchive = program.status !== 'archived';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-program-actions-${program.id}${suffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.programs.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(program)}
          data-testid={`program-action-view-${program.id}${suffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.programs.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(program)}
          data-testid={`program-action-edit-${program.id}${suffix}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.programs.actionEdit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onParticipants(program)}
          data-testid={`program-action-participants-${program.id}${suffix}`}
        >
          <Users className="me-2 h-4 w-4" />
          {t('admin.programs.actionParticipants')}
        </DropdownMenuItem>
        {canActivate ? (
          <DropdownMenuItem
            onClick={() => actions.onActivate(program)}
            data-testid={`program-action-activate-${program.id}${suffix}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.programs.actionActivate')}
          </DropdownMenuItem>
        ) : null}
        {canDeactivate ? (
          <DropdownMenuItem
            onClick={() => actions.onDeactivate(program)}
            data-testid={`program-action-deactivate-${program.id}${suffix}`}
          >
            <Undo2 className="me-2 h-4 w-4" />
            {t('admin.programs.actionDeactivate')}
          </DropdownMenuItem>
        ) : null}
        {canArchive ? (
          <DropdownMenuItem
            onClick={() => actions.onArchive(program)}
            data-testid={`program-action-archive-${program.id}${suffix}`}
          >
            <Archive className="me-2 h-4 w-4" />
            {t('admin.programs.actionArchive')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(program)}
          className="text-destructive focus:text-destructive"
          data-testid={`program-action-delete-${program.id}${suffix}`}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {t('admin.programs.actionDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ProgramsTableProps extends ProgramRowActions {
  programs: AdminProgram[];
}

/** Programs list: table on lg+ screens, stacked cards below. */
export function ProgramsTable({ programs, ...actions }: ProgramsTableProps) {
  const { t, locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium' },
  );
  const formatDate = (iso: string | null) =>
    iso ? dateFormatter.format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : '—';
  const primaryTitle = (p: AdminProgram) =>
    locale === 'ar' ? p.title_ar : p.title_en;
  const secondaryTitle = (p: AdminProgram) =>
    locale === 'ar' ? p.title_en : p.title_ar;
  const excerpt = (p: AdminProgram) =>
    locale === 'ar' ? p.excerpt_ar : p.excerpt_en;

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.programs.columns.program')}</TableHead>
              <TableHead>{t('admin.programs.columns.category')}</TableHead>
              <TableHead>{t('admin.programs.columns.status')}</TableHead>
              <TableHead>{t('admin.programs.columns.startDate')}</TableHead>
              <TableHead>{t('admin.programs.columns.endDate')}</TableHead>
              <TableHead>{t('admin.programs.columns.participants')}</TableHead>
              <TableHead>{t('admin.programs.columns.createdAt')}</TableHead>
              <TableHead className="w-12 text-end">
                {t('admin.programs.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow
                key={program.id}
                className="cursor-pointer"
                onClick={() => actions.onView(program)}
                data-testid={`row-program-${program.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumb program={program} />
                    <div className="min-w-0 max-w-64">
                      <p className="truncate font-medium text-foreground">
                        {primaryTitle(program)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {excerpt(program)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ProgramCategoryBadge category={program.category} />
                </TableCell>
                <TableCell>
                  <ProgramStatusBadge status={program.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(program.start_date)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(program.end_date)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span dir="ltr">
                    {program.participants_count}/{program.max_participants}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(program.created_at)}
                </TableCell>
                <TableCell
                  className="text-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu
                    program={program}
                    actions={actions}
                    variant="desktop"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {programs.map((program) => (
          <Card key={program.id} data-testid={`card-program-${program.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 text-start"
                  onClick={() => actions.onView(program)}
                >
                  <Thumb program={program} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {primaryTitle(program)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {secondaryTitle(program)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(program.start_date)} –{' '}
                      {formatDate(program.end_date)}
                    </p>
                  </div>
                </button>
                <RowActionsMenu
                  program={program}
                  actions={actions}
                  variant="mobile"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ProgramStatusBadge status={program.status} />
                <ProgramCategoryBadge category={program.category} />
                <span
                  className="ms-auto text-xs text-muted-foreground"
                  dir="ltr"
                >
                  {program.participants_count}/{program.max_participants}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
