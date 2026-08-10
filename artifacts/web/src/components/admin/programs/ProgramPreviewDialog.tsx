import { useState } from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  MapPin,
  Target,
  Users,
  UsersRound,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminProgram } from '@/services/adminPrograms';
import { ProgramCategoryBadge, ProgramStatusBadge } from './programBadges';

interface ProgramPreviewDialogProps {
  program: AdminProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Splits the one-per-line objectives/requirements text into list items. */
function lines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Full program preview rendered the way the public site will display it,
 * switchable between the Arabic and English versions.
 */
export function ProgramPreviewDialog({
  program,
  open,
  onOpenChange,
}: ProgramPreviewDialogProps) {
  const { t, locale } = useLocale();
  const [lang, setLang] = useState<'ar' | 'en'>(locale === 'ar' ? 'ar' : 'en');

  if (!program) return null;

  const isAr = lang === 'ar';
  const title = isAr ? program.title_ar : program.title_en;
  const excerpt = isAr ? program.excerpt_ar : program.excerpt_en;
  const content = isAr ? program.description_ar : program.description_en;
  const location = isAr ? program.location_ar : program.location_en;
  const audience = isAr
    ? program.target_audience_ar
    : program.target_audience_en;
  const objectives = lines(
    isAr ? program.objectives_ar : program.objectives_en,
  );
  const requirements = lines(
    isAr ? program.requirements_ar : program.requirements_en,
  );
  const dateFormatter = new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
    dateStyle: 'long',
  });
  const formatDate = (iso: string) =>
    dateFormatter.format(new Date(`${iso}T12:00:00`));
  const remaining = Math.max(
    0,
    program.max_participants - program.participants_count,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? 'rtl' : 'ltr'}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-program-preview"
      >
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pe-6">
            <DialogTitle>{t('admin.programs.previewTitle')}</DialogTitle>
            <Tabs
              value={lang}
              onValueChange={(value) => setLang(value as 'ar' | 'en')}
            >
              <TabsList className="h-8">
                <TabsTrigger
                  value="ar"
                  className="text-xs"
                  data-testid="tab-program-preview-ar"
                >
                  العربية
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="text-xs"
                  data-testid="tab-program-preview-en"
                >
                  English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DialogDescription className="sr-only">
            {t('admin.programs.previewTitle')}
          </DialogDescription>
        </DialogHeader>

        <article className="space-y-4">
          {program.image_url ? (
            <img
              src={program.image_url}
              alt=""
              className="max-h-72 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <ProgramStatusBadge status={program.status} />
            <ProgramCategoryBadge category={program.category} />
          </div>
          <h1
            className="text-2xl font-bold leading-snug text-foreground"
            data-testid="text-program-preview-title"
          >
            {title}
          </h1>
          {excerpt ? (
            <p className="text-base leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {formatDate(program.start_date)} –{' '}
                {formatDate(program.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UsersRound className="h-4 w-4 shrink-0 text-primary" />
              <span>{audience}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {t('admin.programs.participantsInfo', {
                  count: String(program.participants_count),
                  max: String(program.max_participants),
                  remaining: String(remaining),
                })}
              </span>
            </div>
          </div>

          <div
            className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90"
            // Authored in the trusted admin editor; server-sanitized once
            // the Laravel API stores it.
            dangerouslySetInnerHTML={{ __html: content }}
            data-testid="content-program-preview-body"
          />

          {objectives.length ? (
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Target className="h-4 w-4 text-primary" />
                {t('admin.programs.objectivesTitle')}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-foreground/90">
                {objectives.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {requirements.length ? (
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                {t('admin.programs.requirementsTitle')}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-foreground/90">
                {requirements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </DialogContent>
    </Dialog>
  );
}
