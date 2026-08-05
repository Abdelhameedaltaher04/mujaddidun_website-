import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent, useState } from 'react';
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
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

export default function VolunteerPage() {
  const { t } = useLocale();
  const [values, setValues] = useState({ fullName: '', dob: '', email: '', phone: '', experience: '' });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (!trimmed) return t('volunteer.form.validation.phoneRequired');
      return PHONE_PATTERN.test(trimmed) ? undefined : t('volunteer.form.validation.phoneInvalid');
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
    setValues((prev) => Object.fromEntries(
      Object.entries(prev).map(([key, value]) => [key, value.trim()]),
    ) as typeof values);
    setIsSubmitting(true);
    setSuccessOpen(true);
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm">
              <SectionHeading title={t('volunteer.formTitle')} accent="primary" className="mb-8" />
              
              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.form.personalInfo')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-semibold">{t('volunteer.form.fullName')}</Label>
                      <Input
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
                      <Input
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
                      <Input
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
                      <Input
                        id="phone"
                        type="tel"
                        required
                        dir="ltr"
                        value={values.phone}
                        onChange={(e) => updateValue('phone', e.target.value)}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'error-volunteer-phone' : undefined}
                        className={cn('text-start rounded-xl bg-background h-11', invalidClass('phone'))}
                        data-testid="input-volunteer-phone"
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
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) {
            setIsSubmitting(false);
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
                setIsSubmitting(false);
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
