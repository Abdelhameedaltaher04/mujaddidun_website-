import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import {
  isRegistrationEffectivelyOpen,
  type AdminEvent,
} from '@/services/adminEvents';
import { EventStatusBadge, RegistrationOpenBadge } from './eventBadges';

interface EventPreviewDialogProps {
  event: AdminEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full event preview rendered the way the public site will display it,
 * switchable between the Arabic and English versions.
 */
export function EventPreviewDialog({
  event,
  open,
  onOpenChange,
}: EventPreviewDialogProps) {
  const { t, locale } = useLocale();
  const [lang, setLang] = useState<'ar' | 'en'>(locale === 'ar' ? 'ar' : 'en');

  if (!event) return null;

  const isAr = lang === 'ar';
  const title = isAr ? event.title_ar : event.title_en;
  const excerpt = isAr ? event.excerpt_ar : event.excerpt_en;
  const content = isAr ? event.description_ar : event.description_en;
  const location = isAr ? event.location_ar : event.location_en;
  const dateFormatter = new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
    dateStyle: 'full',
  });
  const timeFormatter = new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formatTime = (time: string) =>
    timeFormatter.format(new Date(`2026-01-01T${time}:00`));
  const remaining = Math.max(
    0,
    event.max_participants - event.registrations_count,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? 'rtl' : 'ltr'}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-event-preview"
      >
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pe-6">
            <DialogTitle>{t('admin.events.previewTitle')}</DialogTitle>
            <Tabs
              value={lang}
              onValueChange={(value) => setLang(value as 'ar' | 'en')}
            >
              <TabsList className="h-8">
                <TabsTrigger
                  value="ar"
                  className="text-xs"
                  data-testid="tab-event-preview-ar"
                >
                  العربية
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="text-xs"
                  data-testid="tab-event-preview-en"
                >
                  English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DialogDescription className="sr-only">
            {t('admin.events.previewTitle')}
          </DialogDescription>
        </DialogHeader>

        <article className="space-y-4">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt=""
              className="max-h-72 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={event.status} />
            <RegistrationOpenBadge event={event} />
          </div>
          <h1
            className="text-2xl font-bold leading-snug text-foreground"
            data-testid="text-event-preview-title"
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
                {dateFormatter.format(
                  new Date(`${event.event_date}T12:00:00`),
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span dir="ltr">
                {formatTime(event.start_time)} – {formatTime(event.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {isRegistrationEffectivelyOpen(event)
                  ? t('admin.events.seatsRemaining', {
                      count: String(remaining),
                    })
                  : t('admin.events.registrationClosed')}
              </span>
            </div>
          </div>

          <div
            className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90"
            // Authored in the trusted admin editor; server-sanitized once
            // the Laravel API stores it.
            dangerouslySetInnerHTML={{ __html: content }}
            data-testid="content-event-preview-body"
          />
        </article>
      </DialogContent>
    </Dialog>
  );
}
