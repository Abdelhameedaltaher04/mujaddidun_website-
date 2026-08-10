import { useState } from 'react';
import { Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { ApplicationDocument } from '@/services/adminVolunteers';
import { useApplicationDocuments } from '@/hooks/useAdminVolunteers';

const isImage = (doc: ApplicationDocument) => doc.file_type.startsWith('image/');
const isPdf = (doc: ApplicationDocument) => doc.file_type === 'application/pdf';

/**
 * Private uploaded documents — served through authorized URLs only;
 * never exposed on the public site.
 */
export function ApplicationDocuments({
  applicationId,
}: {
  applicationId: number;
}) {
  const { t, locale } = useLocale();
  const documents = useApplicationDocuments(applicationId);
  const [preview, setPreview] = useState<ApplicationDocument | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const fileTypeLabel = (doc: ApplicationDocument) =>
    doc.file_type.split('/').pop()?.toUpperCase() ?? doc.file_type;

  return (
    <Card data-testid="card-application-documents">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t('admin.volunteers.documentsTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : documents.isError ? (
          <p className="text-sm text-destructive">
            {getApiError(documents.error).message ||
              t('admin.volunteers.genericError')}
          </p>
        ) : documents.data.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-no-documents"
          >
            {t('admin.volunteers.noDocuments')}
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.data.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                data-testid={`document-${doc.id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {isImage(doc) ? (
                      <ImageIcon className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      dir="ltr"
                    >
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fileTypeLabel(doc)} · {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isImage(doc) || isPdf(doc) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreview(doc)}
                      aria-label={t('admin.volunteers.previewDocument')}
                      data-testid={`button-preview-document-${doc.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    data-testid={`button-download-document-${doc.id}`}
                  >
                    <a
                      href={doc.url}
                      download={doc.name}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t('admin.volunteers.downloadDocument')}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
          data-testid="dialog-document-preview"
        >
          <DialogHeader>
            <DialogTitle dir="ltr" className="text-start">
              {preview?.name}
            </DialogTitle>
          </DialogHeader>
          {preview && isImage(preview) ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="w-full rounded-lg object-contain"
            />
          ) : preview ? (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[60vh] w-full rounded-lg border border-border"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
