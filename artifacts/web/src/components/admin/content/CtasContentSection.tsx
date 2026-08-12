import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
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
import type { CtaFiles, CtaInput, CtaSection } from '@/services/adminContent';
import {
  useCreateCta,
  useDeleteCta,
  useReorderCtas,
  useUpdateCta,
} from '@/hooks/useAdminContent';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { CtaFormDialog } from '@/components/admin/content/CtaFormDialog';

interface Props {
  ctas: CtaSection[];
}

export function CtasContentSection({ ctas }: Props) {
  const { t, locale } = useLocale();
  const { toast } = useToast();

  const create = useCreateCta();
  const update = useUpdateCta();
  const remove = useDeleteCta();
  const reorder = useReorderCtas();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<CtaSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CtaSection | null>(null);

  const ordered = useMemo(
    () => [...ctas].sort((a, b) => a.display_order - b.display_order),
    [ctas],
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
  const openEdit = (cta: CtaSection) => {
    setSelected(cta);
    setFormOpen(true);
  };

  const submit = (input: CtaInput, files: CtaFiles) => {
    const onSuccess = () => {
      setFormOpen(false);
      toast({
        description: selected
          ? t('admin.content.ctas.updatedSuccess')
          : t('admin.content.ctas.createdSuccess'),
      });
    };
    if (selected) {
      update.mutate(
        { id: selected.id, input, files },
        { onSuccess, onError: notifyError },
      );
    } else {
      create.mutate({ input, files }, { onSuccess, onError: notifyError });
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
        toast({ description: t('admin.content.ctas.deletedSuccess') });
      },
      onError: notifyError,
    });
  };

  return (
    <Card data-testid="content-section-ctas">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{t('admin.content.tabs.ctas')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.content.ctas.description')}
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-cta">
          <Plus className="me-1.5 h-4 w-4" />
          {t('admin.content.ctas.add')}
        </Button>
      </CardHeader>
      <CardContent>
        {ordered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-12 text-center"
            data-testid="ctas-empty"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Megaphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('admin.content.ctas.empty')}</p>
          </div>
        ) : (
          <div
            className={
              reorder.isPending ? 'pointer-events-none opacity-60' : undefined
            }
          >
            <ul className="space-y-2">
              {ordered.map((cta, index) => (
                <li
                  key={cta.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                  data-testid={`row-cta-${cta.id}`}
                >
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      data-testid={`button-move-up-cta-${cta.id}`}
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
                      data-testid={`button-move-down-cta-${cta.id}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  {cta.image_url ? (
                    <img
                      src={cta.image_url}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {locale === 'ar' ? cta.title_ar : cta.title_en}
                    </p>
                    {cta.button_url ? (
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {cta.button_url}
                      </p>
                    ) : null}
                  </div>
                  {!cta.is_active ? (
                    <Badge variant="secondary" data-testid={`badge-cta-inactive-${cta.id}`}>
                      {t('admin.content.inactive')}
                    </Badge>
                  ) : null}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(cta)}
                      data-testid={`button-edit-cta-${cta.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(cta)}
                      data-testid={`button-delete-cta-${cta.id}`}
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

      <CtaFormDialog
        cta={selected}
        open={formOpen}
        onOpenChange={setFormOpen}
        isSaving={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <GalleryConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        isPending={remove.isPending}
        title={t('admin.content.ctas.deleteTitle')}
        description={t('admin.content.ctas.deleteDescription')}
        actionLabel={t('admin.content.delete')}
        destructive
        testId="dialog-delete-cta"
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
