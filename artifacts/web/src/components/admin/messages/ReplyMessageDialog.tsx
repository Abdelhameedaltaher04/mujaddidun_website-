import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import { RichTextEditor } from '@/components/admin/news/RichTextEditor';
import {
  REPLY_SUBJECT_MAX,
  type ContactMessage,
} from '@/services/adminMessages';

interface ReplyMessageDialogProps {
  message: ContactMessage | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (subject: string, bodyHtml: string) => void;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

/**
 * Reply composer — recipient, subject, and rich-text body. The payload is
 * prepared for POST /contact-messages/{id}/reply; Laravel will send the
 * actual email (no client-side sending).
 */
export function ReplyMessageDialog({
  message,
  open,
  isPending,
  onOpenChange,
  onSend,
}: ReplyMessageDialogProps) {
  const { t, dir } = useLocale();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; body?: string }>(
    {},
  );

  useEffect(() => {
    if (open && message) {
      setSubject(`Re: ${message.subject}`.slice(0, REPLY_SUBJECT_MAX));
      setBody('');
      setErrors({});
    }
  }, [open, message]);

  if (!message) return null;

  const handleSend = () => {
    const nextErrors: { subject?: string; body?: string } = {};
    if (!subject.trim()) {
      nextErrors.subject = t('admin.messages.replySubjectRequired');
    }
    if (!stripHtml(body)) {
      nextErrors.body = t('admin.messages.replyBodyRequired');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSend(subject.trim(), body);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-reply-message"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.messages.replyTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.messages.replyDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('admin.messages.replyTo')}</Label>
            <Input
              value={message.email}
              readOnly
              dir="ltr"
              className="bg-muted/50"
              data-testid="input-reply-recipient"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reply-subject">
              {t('admin.messages.replySubject')}
            </Label>
            <Input
              id="reply-subject"
              value={subject}
              maxLength={REPLY_SUBJECT_MAX}
              onChange={(event) => {
                setSubject(event.target.value);
                if (errors.subject) {
                  setErrors((prev) => ({ ...prev, subject: undefined }));
                }
              }}
              data-testid="input-reply-subject"
            />
            {errors.subject ? (
              <p
                className="text-sm text-destructive"
                data-testid="error-reply-subject"
              >
                {errors.subject}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>{t('admin.messages.replyBody')}</Label>
            <RichTextEditor
              value={body}
              onChange={(html) => {
                setBody(html);
                if (errors.body) {
                  setErrors((prev) => ({ ...prev, body: undefined }));
                }
              }}
              dir={dir}
              testId="editor-reply-body"
            />
            {errors.body ? (
              <p
                className="text-sm text-destructive"
                data-testid="error-reply-body"
              >
                {errors.body}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            data-testid="button-reply-cancel"
          >
            {t('admin.messages.cancel')}
          </Button>
          <Button
            disabled={isPending}
            onClick={handleSend}
            data-testid="button-reply-send"
          >
            {isPending ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="me-1.5 h-4 w-4" />
            )}
            {t('admin.messages.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
