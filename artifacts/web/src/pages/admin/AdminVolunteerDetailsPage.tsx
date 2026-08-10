import { useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  RefreshCw,
  SearchCheck,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { ApplicationStatusBadge } from '@/components/admin/volunteers/volunteerBadges';
import { ApplicationNotes } from '@/components/admin/volunteers/ApplicationNotes';
import { ApplicationDocuments } from '@/components/admin/volunteers/ApplicationDocuments';
import { RejectApplicationDialog } from '@/components/admin/volunteers/RejectApplicationDialog';
import {
  canApprove,
  canReject,
  canReview,
  canWithdraw,
} from '@/components/admin/volunteers/volunteerTransitions';
import {
  useAdminApplication,
  useApplicationStatusAction,
} from '@/hooks/useAdminVolunteers';
import type { ApplicationStatus } from '@/services/adminVolunteers';

type DialogKind = 'review' | 'approve' | 'reject' | 'withdraw' | null;

function InfoRow({ label, value, ltr }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className="mt-0.5 break-words text-sm text-foreground"
        dir={ltr ? 'ltr' : undefined}
      >
        {value ?? '—'}
      </div>
    </div>
  );
}

/** Detailed application panel: profile, review actions, notes, documents. */
export default function AdminVolunteerDetailsPage() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const routeParams = useParams<{ id: string }>();
  const applicationId = Number(routeParams.id);
  const validId = Number.isFinite(applicationId) ? applicationId : null;

  const application = useAdminApplication(validId);
  const statusMutation = useApplicationStatusAction();
  const [dialog, setDialog] = useState<DialogKind>(null);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.volunteers.genericError');

  const formatDate = (iso: string, withTime = false) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}),
    });

  const runStatusChange = (
    status: ApplicationStatus,
    successKey: string,
    rejectionReason?: string,
  ) => {
    if (validId === null) return;
    statusMutation.mutate(
      { id: validId, input: { status, rejection_reason: rejectionReason } },
      {
        onSuccess: () => {
          setDialog(null);
          toast({ description: t(`admin.volunteers.${successKey}`) });
        },
        onError: (error) =>
          toast({ variant: 'destructive', description: errorMessage(error) }),
      },
    );
  };

  const data = application.data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/volunteers" data-testid="link-back-to-volunteers">
              <BackIcon className="me-1.5 h-4 w-4" />
              {t('admin.volunteers.backToList')}
            </Link>
          </Button>
          {data ? <ApplicationStatusBadge status={data.status} /> : null}
        </div>

        {application.isPending ? (
          <div className="space-y-4" data-testid="volunteer-details-loading">
            <Skeleton className="h-28 w-full rounded-lg" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-64 rounded-lg lg:col-span-2" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        ) : application.isError ? (
          <Card data-testid="volunteer-details-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(application.error)}
              </p>
              <Button variant="outline" onClick={() => application.refetch()}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.volunteers.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* Header card */}
            <Card data-testid="card-applicant-header">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={data.avatar_url ?? undefined}
                      alt={data.full_name}
                    />
                    <AvatarFallback className="text-lg">
                      {data.full_name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0] ?? '')
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h1
                      className="text-xl font-bold text-foreground"
                      data-testid="text-applicant-name"
                    >
                      {data.full_name}
                    </h1>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {data.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('admin.volunteers.appliedOn')}{' '}
                      {formatDate(data.applied_at, true)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canReview(data.status) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog('review')}
                      data-testid="button-details-review"
                    >
                      <SearchCheck className="me-1.5 h-4 w-4" />
                      {t('admin.volunteers.actionMarkUnderReview')}
                    </Button>
                  ) : null}
                  {canApprove(data.status) ? (
                    <Button
                      size="sm"
                      onClick={() => setDialog('approve')}
                      data-testid="button-details-approve"
                    >
                      <CheckCircle2 className="me-1.5 h-4 w-4" />
                      {t('admin.volunteers.actionApprove')}
                    </Button>
                  ) : null}
                  {canReject(data.status) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDialog('reject')}
                      data-testid="button-details-reject"
                    >
                      <XCircle className="me-1.5 h-4 w-4" />
                      {t('admin.volunteers.actionReject')}
                    </Button>
                  ) : null}
                  {canWithdraw(data.status) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog('withdraw')}
                      data-testid="button-details-withdraw"
                    >
                      <Ban className="me-1.5 h-4 w-4" />
                      {t('admin.volunteers.actionWithdraw')}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {data.status === 'rejected' && data.rejection_reason ? (
              <Card
                className="border-destructive/30 bg-destructive/5"
                data-testid="card-rejection-reason"
              >
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-destructive">
                    {t('admin.volunteers.rejectReasonLabel')}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {data.rejection_reason}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Profile */}
              <Card className="lg:col-span-2" data-testid="card-applicant-profile">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {t('admin.volunteers.profileTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-x-8 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
                    <InfoRow
                      label={t('admin.volunteers.fields.phone')}
                      value={data.phone}
                      ltr
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.country')}
                      value={data.country}
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.dateOfBirth')}
                      value={
                        data.date_of_birth
                          ? formatDate(data.date_of_birth)
                          : null
                      }
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.education')}
                      value={data.education}
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.preferredArea')}
                      value={data.preferred_area}
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.program')}
                      value={
                        data.program
                          ? locale === 'ar'
                            ? data.program.title_ar
                            : data.program.title_en
                          : null
                      }
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.availability')}
                      value={data.availability}
                    />
                  </div>
                  <div className="mt-2 border-t border-border pt-3">
                    <InfoRow
                      label={t('admin.volunteers.fields.skills')}
                      value={
                        data.skills.length ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {data.skills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="font-normal"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.experience')}
                      value={
                        data.experience ? (
                          <span className="whitespace-pre-line">
                            {data.experience}
                          </span>
                        ) : null
                      }
                    />
                    <InfoRow
                      label={t('admin.volunteers.fields.motivation')}
                      value={
                        data.motivation ? (
                          <span className="whitespace-pre-line">
                            {data.motivation}
                          </span>
                        ) : null
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Side column: documents + notes */}
              <div className="space-y-4">
                <ApplicationDocuments applicationId={data.id} />
                <ApplicationNotes applicationId={data.id} />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <GalleryConfirmDialog
        open={dialog === 'review'}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.reviewTitle')}
        description={t('admin.volunteers.reviewDescription')}
        actionLabel={t('admin.volunteers.actionMarkUnderReview')}
        testId="dialog-confirm-application-review"
        onConfirm={() => runStatusChange('under_review', 'reviewSuccess')}
      />

      <GalleryConfirmDialog
        open={dialog === 'approve'}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.approveTitle')}
        description={t('admin.volunteers.approveDescription')}
        actionLabel={t('admin.volunteers.actionApprove')}
        testId="dialog-confirm-application-approve"
        onConfirm={() => runStatusChange('approved', 'approveSuccess')}
      />

      <RejectApplicationDialog
        open={dialog === 'reject'}
        applicantName={data?.full_name ?? ''}
        isPending={statusMutation.isPending}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={(reason) =>
          runStatusChange('rejected', 'rejectSuccess', reason)
        }
      />

      <GalleryConfirmDialog
        open={dialog === 'withdraw'}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.withdrawTitle')}
        description={t('admin.volunteers.withdrawDescription')}
        actionLabel={t('admin.volunteers.actionWithdraw')}
        destructive
        testId="dialog-confirm-application-withdraw"
        onConfirm={() => runStatusChange('withdrawn', 'withdrawSuccess')}
      />
    </AdminLayout>
  );
}
