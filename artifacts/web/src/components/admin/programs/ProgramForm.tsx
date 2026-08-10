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
  PROGRAM_CATEGORIES,
  PROGRAM_EXCERPT_MAX,
  PROGRAM_LOCATION_MAX,
  PROGRAM_TITLE_MAX,
  type AdminProgram,
  type ProgramCategory,
  type ProgramInput,
  type ProgramStatus,
} from '@/services/adminPrograms';
import { RichTextEditor } from '@/components/admin/news/RichTextEditor';
import { FeaturedImageInput } from '@/components/admin/news/FeaturedImageInput';
import { ProgramPreviewDialog } from './ProgramPreviewDialog';

export interface ProgramFormErrors {
  [field: string]: string;
}

interface ProgramFormProps {
  /** Existing program when editing; null when creating. */
  program: AdminProgram | null;
  isSaving: boolean;
  /** Backend validation errors keyed by field name (Laravel format). */
  serverErrors: ProgramFormErrors;
  onSubmit: (input: ProgramInput) => void;
  onCancel: () => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  description_ar: string;
  description_en: string;
  category: ProgramCategory | '';
  target_audience_ar: string;
  target_audience_en: string;
  location_ar: string;
  location_en: string;
  start_date: string;
  end_date: string;
  max_participants: string;
  objectives_ar: string;
  objectives_en: string;
  requirements_ar: string;
  requirements_en: string;
  status: ProgramStatus;
  image: File | null;
  remove_image: boolean;
}

const EMPTY_HTML = /^(<p>\s*<\/p>)*$/;
const isEmptyHtml = (html: string) =>
  html.trim() === '' || EMPTY_HTML.test(html.trim());

/**
 * Reusable bilingual program form shared by the create and edit pages.
 * Cross-field rules (start date ≤ end date, positive max participants)
 * are validated client-side and will be re-validated by Laravel.
 */
export function ProgramForm({
  program,
  isSaving,
  serverErrors,
  onSubmit,
  onCancel,
}: ProgramFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(() => ({
    title_ar: program?.title_ar ?? '',
    title_en: program?.title_en ?? '',
    excerpt_ar: program?.excerpt_ar ?? '',
    excerpt_en: program?.excerpt_en ?? '',
    description_ar: program?.description_ar ?? '',
    description_en: program?.description_en ?? '',
    category: program?.category ?? '',
    target_audience_ar: program?.target_audience_ar ?? '',
    target_audience_en: program?.target_audience_en ?? '',
    location_ar: program?.location_ar ?? '',
    location_en: program?.location_en ?? '',
    start_date: program?.start_date ?? '',
    end_date: program?.end_date ?? '',
    max_participants: program ? String(program.max_participants) : '',
    objectives_ar: program?.objectives_ar ?? '',
    objectives_en: program?.objectives_en ?? '',
    requirements_ar: program?.requirements_ar ?? '',
    requirements_en: program?.requirements_en ?? '',
    status: program?.status ?? 'draft',
    image: null,
    remove_image: false,
  }));
  const [clientErrors, setClientErrors] = useState<ProgramFormErrors>({});
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
    const next: ProgramFormErrors = {};
    const required = t('admin.programs.required');
    const requireText = (
      key: keyof FormState & string,
      max?: number,
    ): void => {
      const value = String(form[key] ?? '');
      if (!value.trim()) next[key] = required;
      else if (max && value.length > max)
        next[key] = t('admin.programs.tooLong', { max: String(max) });
    };
    requireText('title_ar', PROGRAM_TITLE_MAX);
    requireText('title_en', PROGRAM_TITLE_MAX);
    requireText('excerpt_ar', PROGRAM_EXCERPT_MAX);
    requireText('excerpt_en', PROGRAM_EXCERPT_MAX);
    requireText('location_ar', PROGRAM_LOCATION_MAX);
    requireText('location_en', PROGRAM_LOCATION_MAX);
    requireText('target_audience_ar');
    requireText('target_audience_en');
    requireText('objectives_ar');
    requireText('objectives_en');
    requireText('requirements_ar');
    requireText('requirements_en');
    if (isEmptyHtml(form.description_ar)) next.description_ar = required;
    if (isEmptyHtml(form.description_en)) next.description_en = required;
    if (!form.category) next.category = required;
    if (!form.start_date) next.start_date = required;
    if (!form.end_date) next.end_date = required;
    if (form.start_date && form.end_date && form.start_date > form.end_date)
      next.end_date = t('admin.programs.dateOrderError');
    const max = Number(form.max_participants);
    if (!form.max_participants) next.max_participants = required;
    else if (!Number.isInteger(max) || max <= 0)
      next.max_participants = t('admin.programs.maxParticipantsError');
    setClientErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildInput = (status: ProgramStatus): ProgramInput => ({
    title_ar: form.title_ar.trim(),
    title_en: form.title_en.trim(),
    excerpt_ar: form.excerpt_ar.trim(),
    excerpt_en: form.excerpt_en.trim(),
    description_ar: form.description_ar,
    description_en: form.description_en,
    category: (form.category || 'community') as ProgramCategory,
    target_audience_ar: form.target_audience_ar.trim(),
    target_audience_en: form.target_audience_en.trim(),
    location_ar: form.location_ar.trim(),
    location_en: form.location_en.trim(),
    start_date: form.start_date,
    end_date: form.end_date,
    max_participants: Number(form.max_participants),
    objectives_ar: form.objectives_ar.trim(),
    objectives_en: form.objectives_en.trim(),
    requirements_ar: form.requirements_ar.trim(),
    requirements_en: form.requirements_en.trim(),
    status,
    image: form.image,
    remove_image: form.remove_image,
  });

  const submit = (status: ProgramStatus) => {
    if (!validate()) return;
    onSubmit(buildInput(status));
  };

  /**
   * Activating a draft/archived program moves it to "active"; when editing
   * an already active/completed program the button keeps its status.
   */
  const activateStatus: ProgramStatus =
    !program || program.status === 'draft' || program.status === 'archived'
      ? 'active'
      : program.status;

  /** Live program assembled from the form for the pre-save preview. */
  const previewProgram = useMemo<AdminProgram>(() => {
    const now = new Date().toISOString();
    return {
      id: program?.id ?? 0,
      ...buildInput(form.status),
      max_participants: Number(form.max_participants) || 0,
      participants_count: program?.participants_count ?? 0,
      image_url: form.image
        ? selectedImageUrl
        : form.remove_image
          ? null
          : program?.image_url ?? null,
      created_at: program?.created_at ?? now,
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
    const audienceKey = `target_audience_${lang}` as const;
    const objectivesKey = `objectives_${lang}` as const;
    const requirementsKey = `requirements_${lang}` as const;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`program-title-${lang}`}>
            {t(`admin.programs.fields.title_${lang}`)}
          </Label>
          <Input
            id={`program-title-${lang}`}
            dir={dir}
            value={form[titleKey]}
            maxLength={PROGRAM_TITLE_MAX}
            onChange={(e) => set({ [titleKey]: e.target.value })}
            data-testid={`input-program-title-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[titleKey].length}/{PROGRAM_TITLE_MAX}
          </p>
          {fieldError(titleKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`program-excerpt-${lang}`}>
            {t(`admin.programs.fields.excerpt_${lang}`)}
          </Label>
          <Textarea
            id={`program-excerpt-${lang}`}
            dir={dir}
            rows={3}
            value={form[excerptKey]}
            maxLength={PROGRAM_EXCERPT_MAX}
            onChange={(e) => set({ [excerptKey]: e.target.value })}
            data-testid={`input-program-excerpt-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[excerptKey].length}/{PROGRAM_EXCERPT_MAX}
          </p>
          {fieldError(excerptKey)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`program-location-${lang}`}>
              {t(`admin.programs.fields.location_${lang}`)}
            </Label>
            <Input
              id={`program-location-${lang}`}
              dir={dir}
              value={form[locationKey]}
              maxLength={PROGRAM_LOCATION_MAX}
              onChange={(e) => set({ [locationKey]: e.target.value })}
              data-testid={`input-program-location-${lang}`}
            />
            {fieldError(locationKey)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`program-audience-${lang}`}>
              {t(`admin.programs.fields.target_audience_${lang}`)}
            </Label>
            <Input
              id={`program-audience-${lang}`}
              dir={dir}
              value={form[audienceKey]}
              onChange={(e) => set({ [audienceKey]: e.target.value })}
              data-testid={`input-program-audience-${lang}`}
            />
            {fieldError(audienceKey)}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t(`admin.programs.fields.description_${lang}`)}</Label>
          <RichTextEditor
            value={form[descriptionKey]}
            onChange={(html) => set({ [descriptionKey]: html })}
            dir={dir}
            testId={`editor-program-description-${lang}`}
          />
          {fieldError(descriptionKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`program-objectives-${lang}`}>
            {t(`admin.programs.fields.objectives_${lang}`)}
          </Label>
          <Textarea
            id={`program-objectives-${lang}`}
            dir={dir}
            rows={4}
            value={form[objectivesKey]}
            onChange={(e) => set({ [objectivesKey]: e.target.value })}
            placeholder={t('admin.programs.oneItemPerLine')}
            data-testid={`input-program-objectives-${lang}`}
          />
          {fieldError(objectivesKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`program-requirements-${lang}`}>
            {t(`admin.programs.fields.requirements_${lang}`)}
          </Label>
          <Textarea
            id={`program-requirements-${lang}`}
            dir={dir}
            rows={4}
            value={form[requirementsKey]}
            onChange={(e) => set({ [requirementsKey]: e.target.value })}
            placeholder={t('admin.programs.oneItemPerLine')}
            data-testid={`input-program-requirements-${lang}`}
          />
          {fieldError(requirementsKey)}
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
              {t('admin.programs.contentSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ar">
              <TabsList className="mb-4">
                <TabsTrigger value="ar" data-testid="tab-program-form-ar">
                  العربية
                </TabsTrigger>
                <TabsTrigger value="en" data-testid="tab-program-form-en">
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
                {t('admin.programs.detailsSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('admin.programs.fields.category')}</Label>
                <Select
                  value={form.category || undefined}
                  onValueChange={(value) =>
                    set({ category: value as ProgramCategory })
                  }
                >
                  <SelectTrigger data-testid="select-program-category">
                    <SelectValue
                      placeholder={t('admin.programs.selectCategory')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`admin.programs.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError('category')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="program-start-date">
                  {t('admin.programs.fields.start_date')}
                </Label>
                <Input
                  id="program-start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set({ start_date: e.target.value })}
                  data-testid="input-program-start-date"
                />
                {fieldError('start_date')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="program-end-date">
                  {t('admin.programs.fields.end_date')}
                </Label>
                <Input
                  id="program-end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set({ end_date: e.target.value })}
                  data-testid="input-program-end-date"
                />
                {fieldError('end_date')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="program-max-participants">
                  {t('admin.programs.fields.max_participants')}
                </Label>
                <Input
                  id="program-max-participants"
                  type="number"
                  min={1}
                  value={form.max_participants}
                  onChange={(e) =>
                    set({ max_participants: e.target.value })
                  }
                  data-testid="input-program-max-participants"
                />
                {fieldError('max_participants')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.programs.imageSection')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturedImageInput
                existingUrl={program?.image_url ?? null}
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
          data-testid="button-program-cancel"
        >
          {t('admin.programs.cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          disabled={isSaving}
          data-testid="button-program-preview"
        >
          <Eye className="me-1.5 h-4 w-4" />
          {t('admin.programs.previewAction')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => submit('draft')}
          disabled={isSaving}
          data-testid="button-program-save-draft"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-1.5 h-4 w-4" />
          )}
          {t('admin.programs.saveDraft')}
        </Button>
        <Button
          type="button"
          onClick={() => submit(activateStatus)}
          disabled={isSaving}
          data-testid="button-program-publish"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="me-1.5 h-4 w-4" />
          )}
          {t('admin.programs.publishAction')}
        </Button>
      </div>

      <ProgramPreviewDialog
        program={previewOpen ? previewProgram : null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
