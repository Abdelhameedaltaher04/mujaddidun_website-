import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FormEvent } from 'react';

export default function VolunteerPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: t('common.success'),
      description: t('volunteer.regSuccess'),
    });
    (e.target as HTMLFormElement).reset();
  };

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
              <h2 className="text-3xl font-bold font-display mb-8 text-center text-foreground">{t('volunteer.formTitle')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.form.personalInfo')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-semibold">{t('volunteer.form.fullName')}</Label>
                      <Input id="fullName" required className="rounded-xl bg-background h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="font-semibold">{t('volunteer.form.dob')}</Label>
                      <Input id="dob" type="date" required className="rounded-xl bg-background h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">{t('common.email')}</Label>
                      <Input id="email" type="email" required dir="ltr" className="text-start rounded-xl bg-background h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-semibold">{t('common.phone')}</Label>
                      <Input id="phone" type="tel" required dir="ltr" className="text-start rounded-xl bg-background h-11" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.interests')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {interests.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2 space-x-reverse bg-background p-4 rounded-2xl border border-border hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Checkbox id={`interest-${interest.id}`} className="w-5 h-5 rounded-md" />
                        <Label htmlFor={`interest-${interest.id}`} className="cursor-pointer font-medium w-full ms-2">{interest.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-display text-primary border-b border-border pb-3">{t('volunteer.availability')}</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {times.map((time) => (
                      <div key={time.id} className="flex items-center space-x-2 space-x-reverse bg-background p-4 rounded-2xl border border-border hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Checkbox id={`time-${time.id}`} className="w-5 h-5 rounded-md" />
                        <Label htmlFor={`time-${time.id}`} className="cursor-pointer font-medium w-full ms-2">{time.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="experience" className="font-semibold">{t('volunteer.form.experience')}</Label>
                  <Textarea id="experience" rows={4} className="rounded-xl bg-background resize-none" />
                </div>

                <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold rounded-xl">{t('volunteer.submitReg')}</Button>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
