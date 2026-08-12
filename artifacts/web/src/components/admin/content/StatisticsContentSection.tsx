import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { SiteStatistic, StatisticInput } from '@/services/adminContent';
import {
  useCreateStatistic,
  useDeleteStatistic,
  useReorderStatistics,
  useUpdateStatistic,
} from '@/hooks/useAdminContent';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { StatisticFormDialog } from '@/components/admin/content/StatisticFormDialog';

interface Props {
  statistics: SiteStatistic[];
}

export function StatisticsContentSection({ statistics }: Props) {
  const { t, locale } = useLocale();
  const { toast } = useToast();

  const create = useCreateStatistic();
  const update = useUpdateStatistic();
  const remove = useDeleteStatistic();
  const reorder = useReorderStatistics();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<SiteStatistic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteStatistic | null>(null);

  const ordered = useMemo(
    () => [...statistics].sort((a, b) => a.display_order - b.display_order),
    [statistics],
  );

  const notifyError = (error: unknown) =>
    toast({
      variant: 'destructive',
      description: getApiError(error).message || t('admin.content.saveError'),
    });

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };
  const openEdit = (statistic: SiteStatistic) => {
    setSelected(statistic);
    setFormOpen(true);
  };

  const submit = (input: StatisticInput) => {
    const onSuccess = () => {
      setFormOpen(false);
      toast({
        description: selected
          ? t('admin.content.statistics.updatedSuccess')
          : t('admin.content.statistics.createdSuccess'),
      });
    };
    if (selected) {
      update.mutate({ id: selected.id, input }, { onSuccess, onError: notifyError });
    } else {
      create.mutate(input, { onSuccess, onError: notifyError });
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids, { onError: notifyError });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast({ description: t('admin.content.statistics.deletedSuccess') });
      },
      onError: notifyError,
    });
  };

  return (
    <Card data-testid="content-section-statistics">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{t('admin.content.tabs.statistics')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.content.statistics.description')}
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-statistic">
          <Plus className="me-1.5 h-4 w-4" />
          {t('admin.content.statistics.add')}
        </Button>
      </CardHeader>
      <CardContent>
        {ordered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-12 text-center"
            data-testid="statistics-empty"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {t('admin.content.statistics.empty')}
            </p>
          </div>
        ) : (
          <div
            className={
              reorder.isPending ? 'pointer-events-none opacity-60' : undefined
            }
          >
            <ul className="space-y-2">
              {ordered.map((statistic, index) => (
                <li
                  key={statistic.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                  data-testid={`row-statistic-${statistic.id}`}
                >
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      data-testid={`button-move-up-statistic-${statistic.id}`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === ordered.length - 1}
                      onClick={() => move(index, 1)}
                      data-testid={`button-move-down-statistic-${statistic.id}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="min-w-16 text-lg font-bold text-primary" dir="ltr">
                    {statistic.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {locale === 'ar' ? statistic.label_ar : statistic.label_en}
                    </p>
                    {statistic.icon ? (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {statistic.icon}
                      </p>
                    ) : null}
                  </div>
                  {!statistic.is_active ? (
                    <Badge variant="secondary" data-testid={`badge-statistic-inactive-${statistic.id}`}>
                      {t('admin.content.inactive')}
                    </Badge>
                  ) : null}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(statistic)}
                      data-testid={`button-edit-statistic-${statistic.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(statistic)}
                      data-testid={`button-delete-statistic-${statistic.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <StatisticFormDialog
        statistic={selected}
        open={formOpen}
        onOpenChange={setFormOpen}
        isSaving={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <GalleryConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        isPending={remove.isPending}
        title={t('admin.content.statistics.deleteTitle')}
        description={t('admin.content.statistics.deleteDescription')}
        actionLabel={t('admin.content.delete')}
        destructive
        testId="dialog-delete-statistic"
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
