import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import {
  EVENT_EXCERPT_MAX,
  EVENT_LOCATION_MAX,
  EVENT_TITLE_MAX,
  type AdminEvent,
  type EventInput,
  type EventStatus,
  type RegistrationOpenStatus,
} from '@/services/adminEvents';
import { RichTextEditor } from '@/components/admin/news/RichTextEditor';
import { FeaturedImageInput } from '@/components/admin/news/FeaturedImageInput';
import { EventPreviewDialog } from './EventPreviewDialog';

export interface EventFormErrors {
  [field: string]: string;
}

interface EventFormProps {
  /** Existing event when editing; null when creating. */
  event: AdminEvent | null;
  isSaving: boolean;
  /** Backend validation errors keyed by field name (Laravel format). */
  serverErrors: EventFormErrors;
  onSubmit: (input: EventInput) => void;
  onCancel: () => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  description_ar: string;
  description_en: string;
  location_ar: string;
  location_en: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_participants: string;
  registration_start_date: string;
  registration_end_date: string;
  registration_status: RegistrationOpenStatus;
  status: EventStatus;
  image: File | null;
  remove_image: boolean;
}

const EMPTY_HTML = /^(<p>\s*<\/p>)*$/;
const isEmptyHtml = (html: string) =>
  html.trim() === '' || EMPTY_HTML.test(html.trim());

/**
 * Reusable bilingual event form shared by the create and edit pages.
 * Cross-field rules (start < end time, registration end ≤ event date,
 * positive max participants) are validated client-side and will be
 * re-validated by Laravel.
 */
export function EventForm({
  event,
  isSaving,
  serverErrors,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(() => ({
    title_ar: event?.title_ar ?? '',
    title_en: event?.title_en ?? '',
    excerpt_ar: event?.excerpt_ar ?? '',
    excerpt_en: event?.excerpt_en ?? '',
    description_ar: event?.description_ar ?? '',
    description_en: event?.description_en ?? '',
    location_ar: event?.location_ar ?? '',
    location_en: event?.location_en ?? '',
    event_date: event?.event_date ?? '',
    start_time: event?.start_time ?? '',
    end_time: event?.end_time ?? '',
    max_participants: event ? String(event.max_participants) : '',
    registration_start_date: event?.registration_start_date ?? '',
    registration_end_date: event?.registration_end_date ?? '',
    registration_status: event?.registration_status ?? 'open',
    status: event?.status ?? 'draft',
    image: null,
    remove_image: false,
  }));
  const [clientErrors, setClientErrors] = useState<EventFormErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  /** Single object URL for the selected file; revoked on replace/unmount. */
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
    null,
  );

  const replaceSelectedImageUrl = (file: File | null) => {
    setSelectedImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  useEffect(() => {
    return () => {
      setSelectedImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    /** Clear stale validation errors for fields the user is editing. */
    setClientErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const errors = { ...serverErrors, ...clientErrors };

  const validate = (): boolean => {
    const next: EventFormErrors = {};
    const required = t('admin.events.required');
    const requireText = (
      key: keyof FormState & string,
      max?: number,
    ): void => {
      const value = String(form[key] ?? '');
      if (!value.trim()) next[key] = required;
      else if (max && value.length > max)
        next[key] = t('admin.events.tooLong', { max: String(max) });
    };
    requireText('title_ar', EVENT_TITLE_MAX);
    requireText('title_en', EVENT_TITLE_MAX);
    requireText('excerpt_ar', EVENT_EXCERPT_MAX);
    requireText('excerpt_en', EVENT_EXCERPT_MAX);
    requireText('location_ar', EVENT_LOCATION_MAX);
    requireText('location_en', EVENT_LOCATION_MAX);
    if (isEmptyHtml(form.description_ar)) next.description_ar = required;
    if (isEmptyHtml(form.description_en)) next.description_en = required;
    if (!form.event_date) next.event_date = required;
    if (!form.start_time) next.start_time = required;
    if (!form.end_time) next.end_time = required;
    if (form.start_time && form.end_time && form.start_time >= form.end_time)
      next.end_time = t('admin.events.timeOrderError');
    const max = Number(form.max_participants);
    if (!form.max_participants) next.max_participants = required;
    else if (!Number.isInteger(max) || max <= 0)
      next.max_participants = t('admin.events.maxParticipantsError');
    if (
      form.registration_start_date &&
      form.registration_end_date &&
      form.registration_start_date > form.registration_end_date
    )
      next.registration_end_date = t('admin.events.regDateOrderError');
    if (
      form.registration_end_date &&
      form.event_date &&
      form.registration_end_date > form.event_date
    )
      next.registration_end_date = t('admin.events.regEndAfterEventError');
    setClientErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildInput = (status: EventStatus): EventInput => ({
    title_ar: form.title_ar.trim(),
    title_en: form.title_en.trim(),
    excerpt_ar: form.excerpt_ar.trim(),
    excerpt_en: form.excerpt_en.trim(),
    description_ar: form.description_ar,
    description_en: form.description_en,
    location_ar: form.location_ar.trim(),
    location_en: form.location_en.trim(),
    event_date: form.event_date,
    start_time: form.start_time,
    end_time: form.end_time,
    max_participants: Number(form.max_participants),
    registration_start_date: form.registration_start_date || null,
    registration_end_date: form.registration_end_date || null,
    registration_status: form.registration_status,
    status,
    image: form.image,
    remove_image: form.remove_image,
  });

  const submit = (status: EventStatus) => {
    if (!validate()) return;
    onSubmit(buildInput(status));
  };

  /**
   * Publishing a draft moves it to "upcoming"; when editing an already
   * published/ongoing event the publish button keeps its current status.
   */
  const publishStatus: EventStatus =
    !event || event.status === 'draft' ? 'upcoming' : event.status;

  /** Live event assembled from the form for the pre-save preview. */
  const previewEvent = useMemo<AdminEvent>(() => {
    const now = new Date().toISOString();
    return {
      id: event?.id ?? 0,
      ...buildInput(form.status),
      max_participants: Number(form.max_participants) || 0,
      registrations_count: event?.registrations_count ?? 0,
      image_url: form.image
        ? selectedImageUrl
        : form.remove_image
          ? null
          : event?.image_url ?? null,
      created_at: event?.created_at ?? now,
      updated_at: now,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen]);

  const fieldError = (name: string) =>
    errors[name] ? (
      <p className="text-sm text-destructive" data-testid={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;

  const bilingualFields = (lang: 'ar' | 'en') => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleKey = `title_${lang}` as const;
    const excerptKey = `excerpt_${lang}` as const;
    const descriptionKey = `description_${lang}` as const;
    const locationKey = `location_${lang}` as const;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`event-title-${lang}`}>
            {t(`admin.events.fields.title_${lang}`)}
          </Label>
          <Input
            id={`event-title-${lang}`}
            dir={dir}
            value={form[titleKey]}
            maxLength={EVENT_TITLE_MAX}
            onChange={(e) => set({ [titleKey]: e.target.value })}
            data-testid={`input-event-title-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[titleKey].length}/{EVENT_TITLE_MAX}
          </p>
          {fieldError(titleKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`event-excerpt-${lang}`}>
            {t(`admin.events.fields.excerpt_${lang}`)}
          </Label>
          <Textarea
            id={`event-excerpt-${lang}`}
            dir={dir}
            rows={3}
            value={form[excerptKey]}
            maxLength={EVENT_EXCERPT_MAX}
            onChange={(e) => set({ [excerptKey]: e.target.value })}
            data-testid={`input-event-excerpt-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[excerptKey].length}/{EVENT_EXCERPT_MAX}
          </p>
          {fieldError(excerptKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`event-location-${lang}`}>
            {t(`admin.events.fields.location_${lang}`)}
          </Label>
          <Input
            id={`event-location-${lang}`}
            dir={dir}
            value={form[locationKey]}
            maxLength={EVENT_LOCATION_MAX}
            onChange={(e) => set({ [locationKey]: e.target.value })}
            data-testid={`input-event-location-${lang}`}
          />
          {fieldError(locationKey)}
        </div>
        <div className="space-y-1.5">
          <Label>{t(`admin.events.fields.description_${lang}`)}</Label>
          <RichTextEditor
            value={form[descriptionKey]}
            onChange={(html) => set({ [descriptionKey]: html })}
            dir={dir}
            testId={`editor-event-description-${lang}`}
          />
          {fieldError(descriptionKey)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.events.contentSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ar">
              <TabsList className="mb-4">
                <TabsTrigger value="ar" data-testid="tab-event-form-ar">
                  العربية
                </TabsTrigger>
                <TabsTrigger value="en" data-testid="tab-event-form-en">
                  English
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ar">{bilingualFields('ar')}</TabsContent>
              <TabsContent value="en">{bilingualFields('en')}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.events.scheduleSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="event-date">
                  {t('admin.events.fields.event_date')}
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.event_date}
                  onChange={(e) => set({ event_date: e.target.value })}
                  data-testid="input-event-date"
                />
                {fieldError('event_date')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-start-time">
                    {t('admin.events.fields.start_time')}
                  </Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => set({ start_time: e.target.value })}
                    data-testid="input-event-start-time"
                  />
                  {fieldError('start_time')}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-end-time">
                    {t('admin.events.fields.end_time')}
                  </Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => set({ end_time: e.target.value })}
                    data-testid="input-event-end-time"
                  />
                  {fieldError('end_time')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.events.registrationSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="event-max-participants">
                  {t('admin.events.fields.max_participants')}
                </Label>
                <Input
                  id="event-max-participants"
                  type="number"
                  min={1}
                  value={form.max_participants}
                  onChange={(e) =>
                    set({ max_participants: e.target.value })
                  }
                  data-testid="input-event-max-participants"
                />
                {fieldError('max_participants')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-reg-start">
                  {t('admin.events.fields.registration_start_date')}
                </Label>
                <Input
                  id="event-reg-start"
                  type="date"
                  value={form.registration_start_date}
                  onChange={(e) =>
                    set({ registration_start_date: e.target.value })
                  }
                  data-testid="input-event-reg-start"
                />
                {fieldError('registration_start_date')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-reg-end">
                  {t('admin.events.fields.registration_end_date')}
                </Label>
                <Input
                  id="event-reg-end"
                  type="date"
                  value={form.registration_end_date}
                  onChange={(e) =>
                    set({ registration_end_date: e.target.value })
                  }
                  data-testid="input-event-reg-end"
                />
                {fieldError('registration_end_date')}
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.events.fields.registration_status')}</Label>
                <Select
                  value={form.registration_status}
                  onValueChange={(value) =>
                    set({
                      registration_status: value as RegistrationOpenStatus,
                    })
                  }
                >
                  <SelectTrigger data-testid="select-event-reg-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      {t('admin.events.registrationOpen')}
                    </SelectItem>
                    <SelectItem value="closed">
                      {t('admin.events.registrationClosed')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.events.imageSection')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturedImageInput
                existingUrl={event?.image_url ?? null}
                file={form.image}
                removeExisting={form.remove_image}
                onChange={({ file, removeExisting }) => {
                  replaceSelectedImageUrl(file);
                  set({ image: file, remove_image: removeExisting });
                }}
                error={errors.image}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          data-testid="button-event-cancel"
        >
          {t('admin.events.cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          disabled={isSaving}
          data-testid="button-event-preview"
        >
          <Eye className="me-1.5 h-4 w-4" />
          {t('admin.events.previewAction')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => submit('draft')}
          disabled={isSaving}
          data-testid="button-event-save-draft"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-1.5 h-4 w-4" />
          )}
          {t('admin.events.saveDraft')}
        </Button>
        <Button
          type="button"
          onClick={() => submit(publishStatus)}
          disabled={isSaving}
          data-testid="button-event-publish"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="me-1.5 h-4 w-4" />
          )}
          {t('admin.events.publishAction')}
        </Button>
      </div>

      <EventPreviewDialog
        event={previewOpen ? previewEvent : null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
