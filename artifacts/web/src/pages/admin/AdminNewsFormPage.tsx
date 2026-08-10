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
  NewsForm,
  type NewsFormErrors,
} from '@/components/admin/news/NewsForm';
import {
  useAdminNewsArticle,
  useCreateNews,
  useUpdateNews,
} from '@/hooks/useAdminNews';
import type { NewsInput } from '@/services/adminNews';

/**
 * Create (/admin/news/new) and edit (/admin/news/:id/edit) page — both
 * render the same reusable NewsForm.
 */
export default function AdminNewsFormPage() {
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const routeParams = useParams<{ id?: string }>();
  const editId = routeParams.id ? Number(routeParams.id) : null;
  const isEdit = editId !== null && Number.isFinite(editId);

  const article = useAdminNewsArticle(isEdit ? editId : null);
  const create = useCreateNews();
  const update = useUpdateNews();
  const [serverErrors, setServerErrors] = useState<NewsFormErrors>({});

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const isSaving = create.isPending || update.isPending;

  const handleSubmit = (input: NewsInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      /** Laravel 422 responses land under the matching fields. */
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.news.genericError'),
      });
    };
    const onSuccess = () => {
      toast({
        description:
          input.status === 'published'
            ? t('admin.news.publishedSuccess')
            : t('admin.news.savedDraftSuccess'),
      });
      navigate('/admin/news');
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
            href="/admin/news"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-testid="link-back-to-news"
          >
            <BackIcon className="h-4 w-4" />
            {t('admin.news.backToList')}
          </Link>
          <h1
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-news-form-title"
          >
            {isEdit ? t('admin.news.editNews') : t('admin.news.addNews')}
          </h1>
        </div>

        {isEdit && article.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : isEdit && article.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {getApiError(article.error).message ||
                  t('admin.news.genericError')}
              </p>
              <Button variant="outline" onClick={() => article.refetch()}>
                {t('admin.news.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <NewsForm
            key={isEdit ? editId : 'new'}
            article={isEdit ? article.data ?? null : null}
            isSaving={isSaving}
            serverErrors={serverErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/news')}
          />
        )}
      </div>
    </AdminLayout>
  );
}
