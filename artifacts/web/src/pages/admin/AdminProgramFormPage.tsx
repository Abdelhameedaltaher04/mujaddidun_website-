import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  ProgramForm,
  type ProgramFormErrors,
} from '@/components/admin/programs/ProgramForm';
import {
  useAdminProgram,
  useCreateProgram,
  useUpdateProgram,
} from '@/hooks/useAdminPrograms';
import type { ProgramInput } from '@/services/adminPrograms';

/**
 * Create (/admin/programs/new) and edit (/admin/programs/:id/edit) page —
 * both render the same reusable ProgramForm.
 */
export default function AdminProgramFormPage() {
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const routeParams = useParams<{ id?: string }>();
  const editId = routeParams.id ? Number(routeParams.id) : null;
  const isEdit = editId !== null && Number.isFinite(editId);

  const program = useAdminProgram(isEdit ? editId : null);
  const create = useCreateProgram();
  const update = useUpdateProgram();
  const [serverErrors, setServerErrors] = useState<ProgramFormErrors>({});

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const isSaving = create.isPending || update.isPending;

  const handleSubmit = (input: ProgramInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      /** Laravel 422 responses land under the matching fields. */
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.programs.genericError'),
      });
    };
    const onSuccess = () => {
      toast({
        description:
          input.status === 'draft'
            ? t('admin.programs.savedDraftSuccess')
            : t('admin.programs.publishedSuccess'),
      });
      navigate('/admin/programs');
    };
    if (isEdit && editId) {
      update.mutate({ id: editId, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-testid="link-back-to-programs"
          >
            <BackIcon className="h-4 w-4" />
            {t('admin.programs.backToList')}
          </Link>
          <h1
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-program-form-title"
          >
            {isEdit
              ? t('admin.programs.editProgram')
              : t('admin.programs.addProgram')}
          </h1>
        </div>

        {isEdit && program.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : isEdit && program.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {getApiError(program.error).message ||
                  t('admin.programs.genericError')}
              </p>
              <Button variant="outline" onClick={() => program.refetch()}>
                {t('admin.programs.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ProgramForm
            key={isEdit ? editId : 'new'}
            program={isEdit ? program.data ?? null : null}
            isSaving={isSaving}
            serverErrors={serverErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/programs')}
          />
        )}
      </div>
    </AdminLayout>
  );
}
