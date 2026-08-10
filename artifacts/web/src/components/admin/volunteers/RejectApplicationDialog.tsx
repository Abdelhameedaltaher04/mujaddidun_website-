import { useEffect, useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import { REJECTION_REASON_MAX } from '@/services/adminVolunteers';

interface RejectApplicationDialogProps {
  open: boolean;
  applicantName: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

/** Rejection requires an explicit reason (validated inline). */
export function RejectApplicationDialog({
  open,
  applicantName,
  isPending,
  onOpenChange,
  onConfirm,
}: RejectApplicationDialogProps) {
  const { t } = useLocale();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t('admin.volunteers.rejectReasonRequired'));
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="dialog-reject-application"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.volunteers.rejectTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.volunteers.rejectDescription').replace(
              '{name}',
              applicantName,
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="rejection-reason">
            {t('admin.volunteers.rejectReasonLabel')}
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            maxLength={REJECTION_REASON_MAX}
            rows={4}
            placeholder={t('admin.volunteers.rejectReasonPlaceholder')}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
            data-testid="input-rejection-reason"
          />
          {error ? (
            <p
              className="text-sm text-destructive"
              data-testid="error-rejection-reason"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            data-testid="button-reject-cancel"
          >
            {t('admin.volunteers.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
            data-testid="button-reject-confirm"
          >
            {isPending ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="me-1.5 h-4 w-4" />
            )}
            {t('admin.volunteers.actionReject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
