import { useState } from 'react';
import { Loader2, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { NOTE_MAX } from '@/services/adminVolunteers';
import {
  useAddApplicationNote,
  useApplicationNotes,
} from '@/hooks/useAdminVolunteers';

/**
 * Internal notes — visible only to admins/moderators inside the admin panel;
 * Laravel policies must keep them out of any public response.
 */
export function ApplicationNotes({ applicationId }: { applicationId: number }) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const notes = useApplicationNotes(applicationId);
  const addNote = useAddApplicationNote();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleAdd = () => {
    if (!body.trim()) {
      setError(t('admin.volunteers.noteRequired'));
      return;
    }
    addNote.mutate(
      { id: applicationId, body: body.trim() },
      {
        onSuccess: () => {
          setBody('');
          toast({ description: t('admin.volunteers.noteAdded') });
        },
        onError: (mutationError) =>
          toast({
            variant: 'destructive',
            description:
              getApiError(mutationError).message ||
              t('admin.volunteers.genericError'),
          }),
      },
    );
  };

  return (
    <Card data-testid="card-application-notes">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {t('admin.volunteers.notesTitle')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('admin.volunteers.notesHint')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : notes.isError ? (
          <p className="text-sm text-destructive">
            {getApiError(notes.error).message ||
              t('admin.volunteers.genericError')}
          </p>
        ) : notes.data.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-no-notes"
          >
            {t('admin.volunteers.noNotes')}
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.data.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-border bg-muted/40 p-3"
                data-testid={`note-${note.id}`}
              >
                <p className="whitespace-pre-line text-sm text-foreground">
                  {note.body}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {note.author_name} · {formatDateTime(note.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-1.5">
          <Textarea
            value={body}
            rows={3}
            maxLength={NOTE_MAX}
            placeholder={t('admin.volunteers.notePlaceholder')}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
            }}
            data-testid="input-application-note"
          />
          {error ? (
            <p className="text-sm text-destructive" data-testid="error-note">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addNote.isPending}
              data-testid="button-add-note"
            >
              {addNote.isPending ? (
                <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="me-1.5 h-4 w-4" />
              )}
              {t('admin.volunteers.addNote')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
