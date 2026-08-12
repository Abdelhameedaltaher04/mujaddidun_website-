import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/icon-input';
import { CountryPhoneField } from '@/components/forms/CountryPhoneField';
import { User, CalendarDays, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { publicVolunteersApi } from '@/services/publicVolunteers';
import { getApiError } from '@/services/api';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { FormContactHelp } from '@/components/layout/FormContactHelp';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export default function VolunteerPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const staff = isStaff(user);
  const [values, setValues] = useState({ fullName: '', dob: '', email: '', phone: '', experience: '' });
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('JO');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const submitMutation = useMutation({
    mutationFn: publicVolunteersApi.apply,
    onSuccess: () => {
      setSuccessOpen(true);
      setFormError(null);
      setErrors({});
    },
    onError: (error: unknown) => {
      const { fields, status } = getApiError(error);
      const fieldErrors: Record<string, string> = {};
      const fieldMap: Record<string, string> = {
        full_name: 'fullName',
        date_of_birth: 'dob',
        email: 'email',
        phone: 'phone',
        interests: 'interests',
        availability: 'times',
        experience: 'experience',
      };
      Object.entries(fields ?? {}).forEach(([apiField, message]) => {
        // Array rules come back as e.g. "interests.0" — map to the group.
        const base = apiField.split('.')[0];
        const formField = fieldMap[base];
        if (formField && !fieldErrors[formField]) fieldErrors[formField] = message;
      });
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) {
        setFormError(null);
      } else if (status === 429) {
        setFormError(t('volunteer.form.tooMany'));
      } else if (status === undefined) {
        setFormError(t('news.networkError'));
      } else {
        setFormError(t('volunteer.form.sendError'));
      }
    },
  });
  const isSubmitting = submitMutation.isPending;

  const interests = [
    { id: 'feeding', label: t('volunteer.interestsList.feeding') },
    { id: 'housing', label: t('volunteer.interestsList.housing') },
    { id: 'empowerment', label: t('volunteer.interestsList.empowerment') },
    { id: 'admin', label: t('volunteer.interestsList.admin') },
    { id: 'media', label: t('volunteer.interestsList.media') },
    { id: 'events', label: t('volunteer.interestsList.events') }
  ];

  const times = [
    { id: 'morning', label: t('volunteer.availabilityList.morning') },
    { id: 'evening', label: t('volunteer.availabilityList.evening') },
    { id: 'weekends', label: t('volunteer.availabilityList.weekends') }
  ];

  const validateField = (field: string, value: string) => {
    const trimmed = value.trim();
    if (field === 'fullName') return trimmed ? undefined : t('volunteer.form.validation.fullNameRequired');
    if (field === 'dob') return trimmed ? undefined : t('volunteer.form.validation.dobRequired');
    if (field === 'email') {
      if (!trimmed) return t('volunteer.form.validation.emailRequired');
      return EMAIL_PATTERN.test(trimmed) ? undefined : t('volunteer.form.validation.emailInvalid');
    }
    if (field === 'phone') {
      if (!trimmed || trimmed === '+962') return t('volunteer.form.validation.phoneRequired');
      return isValidPhoneNumber(trimmed, phoneCountry) ? undefined : t('volunteer.form.validation.phoneInvalid');
    }
    return undefined;
  };

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) ?? '' }));
    }
  };

  const toggleSelection = (
    field: 'interests' | 'times',
    value: string,
  ) => {
    const setter = field === 'interests' ? setSelectedInterests : setSelectedTimes;
    setter((current) => {
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      const errorKey = field === 'interests' ? 'interests' : 'times';
      if (next.length > 0) {
        setErrors((prev) => ({ ...prev, [errorKey]: '' }));
      }
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const nextErrors: Record<string, string> = {};
    (['fullName', 'dob', 'email', 'phone'] as const).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) nextErrors[field] = error;
    });
    if (selectedInterests.length === 0) {
      nextErrors.interests = t('volunteer.form.validation.interestRequired');
    }
    if (selectedTimes.length === 0) {
      nextErrors.times = t('volunteer.form.validation.availabilityRequired');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    ) as typeof values;
    setValues(trimmed);
    setFormError(null);
    submitMutation.mutate({
      full_name: trimmed.fullName,
      date_of_birth: trimmed.dob,
      email: trimmed.email,
      phone: trimmed.phone,
      interests: selectedInterests,
      availability: selectedTimes,
      experience: trimmed.experience,
      website: honeypot,
    });
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="text-sm text-destructive" role="alert" data-testid={`error-volunteer-${field}`}>
        {errors[field]}
      </p>
    ) : null;

  const invalidClass = (field: string) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('volunteer.title')} 
        description={t('volunteer.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('volunteer.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          {staff ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center" data-testid="volunteer-staff-notice">
              <p className="text-muted-foreground">{t('common.staffActionNotice')}</p>
            </div>
          ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm">
              <SectionHeading title={t('volunteer.formTitle')} accent="primary" className="mb-8" />
              
              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                {/* Honeypot field — visually hidden, ignored by humans. */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="volunteer-website">Website</label>
                  <input
                    id="volunteer-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.form.personalInfo')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-semibold">{t('volunteer.form.fullName')}</Label>
                      <IconInput
                        icon={User}
                        id="fullName"
                        required
                        value={values.fullName}
                        onChange={(e) => updateValue('fullName', e.target.value)}
                        aria-invalid={!!errors.fullName}
                        aria-describedby={errors.fullName ? 'error-volunteer-fullName' : undefined}
                        className={cn('rounded-xl bg-background h-11', invalidClass('fullName'))}
                        data-testid="input-volunteer-fullName"
                      />
                      {fieldError('fullName')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="font-semibold">{t('volunteer.form.dob')}</Label>
                      <IconInput
                        icon={CalendarDays}
                        id="dob"
                        type="date"
                        required
                        value={values.dob}
                        onChange={(e) => updateValue('dob', e.target.value)}
                        aria-invalid={!!errors.dob}
                        aria-describedby={errors.dob ? 'error-volunteer-dob' : undefined}
                        className={cn('rounded-xl bg-background h-11', invalidClass('dob'))}
                        data-testid="input-volunteer-dob"
                      />
                      {fieldError('dob')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">{t('common.email')}</Label>
                      <IconInput
                        icon={Mail}
                        id="email"
                        type="email"
                        required
                        dir="ltr"
                        value={values.email}
                        onChange={(e) => updateValue('email', e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'error-volunteer-email' : undefined}
                        className={cn('text-start rounded-xl bg-background h-11', invalidClass('email'))}
                        data-testid="input-volunteer-email"
                      />
                      {fieldError('email')}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-semibold">{t('common.phone')}</Label>
                      <CountryPhoneField
                        id="phone"
                        value={values.phone}
                        onChange={(value) => updateValue('phone', value)}
                        onCountryChange={(country) => setPhoneCountry(country.code)}
                        ariaInvalid={!!errors.phone}
                        ariaDescribedBy={errors.phone ? 'error-volunteer-phone' : undefined}
                        inputTestId="input-volunteer-phone"
                      />
                      {fieldError('phone')}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.interests')}</h3>
                  <div className={cn('grid gap-4 sm:grid-cols-2 rounded-xl', errors.interests && 'border border-destructive/60 p-2')}>
                    {interests.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2 space-x-reverse bg-background p-4 rounded-2xl border border-border hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Checkbox
                          id={`interest-${interest.id}`}
                          checked={selectedInterests.includes(interest.id)}
                          onCheckedChange={() => toggleSelection('interests', interest.id)}
                          className="w-5 h-5 rounded-md"
                        />
                        <Label htmlFor={`interest-${interest.id}`} className="cursor-pointer font-medium w-full ms-2">{interest.label}</Label>
                      </div>
                    ))}
                  </div>
                  {fieldError('interests')}
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.availability')}</h3>
                  <div className={cn('grid gap-4 sm:grid-cols-3 rounded-xl', errors.times && 'border border-destructive/60 p-2')}>
                    {times.map((time) => (
                      <div key={time.id} className="flex items-center space-x-2 space-x-reverse bg-background p-4 rounded-2xl border border-border hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Checkbox
                          id={`time-${time.id}`}
                          checked={selectedTimes.includes(time.id)}
                          onCheckedChange={() => toggleSelection('times', time.id)}
                          className="w-5 h-5 rounded-md"
                        />
                        <Label htmlFor={`time-${time.id}`} className="cursor-pointer font-medium w-full ms-2">{time.label}</Label>
                      </div>
                    ))}
                  </div>
                  {fieldError('times')}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="experience" className="font-semibold">{t('volunteer.form.experience')}</Label>
                   <Textarea
                     id="experience"
                     rows={4}
                     value={values.experience}
                     onChange={(e) => updateValue('experience', e.target.value)}
                     className="rounded-xl bg-background resize-none"
                   />
                </div>

                {formError && (
                  <p className="text-sm text-destructive" role="alert" data-testid="error-volunteer-form">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-bold rounded-xl"
                  data-testid="button-volunteer-submit"
                >
                  {isSubmitting ? t('common.loading') : t('volunteer.submitReg')}
                </Button>
              </form>
              <FormContactHelp />
            </div>
          </div>
          )}
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) {
            setValues({ fullName: '', dob: '', email: '', phone: '', experience: '' });
            setSelectedInterests([]);
            setSelectedTimes([]);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-volunteer-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t('volunteer.form.validation.successTitle')}</DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('volunteer.form.validation.successMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                setSuccessOpen(false);
                setValues({ fullName: '', dob: '', email: '', phone: '', experience: '' });
                setSelectedInterests([]);
                setSelectedTimes([]);
              }}
              data-testid="button-volunteer-success-ok"
            >
              {t('volunteer.form.validation.okBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
