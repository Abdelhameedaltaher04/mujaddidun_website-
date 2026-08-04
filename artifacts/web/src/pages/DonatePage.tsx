import { useState, FormEvent } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DonatePage() {
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [donationType, setDonationType] = useState('general');
  const [frequency, setFrequency] = useState('once');
  const [amount, setAmount] = useState('50');

  const types = [
    { id: 'general', label: t('donate.types.general') },
    { id: 'feeding', label: t('donate.types.feeding') },
    { id: 'housing', label: t('donate.types.housing') },
    { id: 'empowerment', label: t('donate.types.empowerment') },
    { id: 'zakat', label: t('donate.types.zakat') }
  ];

  const frequencies = [
    { id: 'once', label: t('donate.frequency.once') },
    { id: 'monthly', label: t('donate.frequency.monthly') }
  ];

  const amounts = ['10', '20', '50', '100'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: t('common.success'),
      description: t('donate.success'),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('donate.title')} 
        description={t('donate.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' }, 
          { label: t('donate.title') }
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            {/* Form Section */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Donation Type */}
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-bold">{t('donate.types.title')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label={t('donate.aria.typesGroup')}>
                    {types.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setDonationType(type.id)}
                        aria-pressed={donationType === type.id}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-sm font-medium transition-all focus-ring-standard",
                          donationType === type.id 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background border-border text-foreground hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Frequency */}
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-bold">{t('donate.frequency.title')}</h3>
                  <div className="flex gap-3" role="group" aria-label={t('donate.aria.frequencyGroup')}>
                    {frequencies.map(freq => (
                      <button
                        key={freq.id}
                        type="button"
                        onClick={() => setFrequency(freq.id)}
                        aria-pressed={frequency === freq.id}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-2xl border font-medium transition-all focus-ring-standard",
                          frequency === freq.id 
                            ? "bg-secondary text-secondary-foreground border-secondary" 
                            : "bg-background border-border text-foreground hover:border-secondary hover:bg-secondary/5"
                        )}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Amount */}
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-bold">{t('donate.amount.title')}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" role="group" aria-label={t('donate.aria.amountGroup')}>
                    {amounts.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        aria-pressed={amount === amt}
                        className={cn(
                          "px-2 py-4 rounded-2xl border text-lg font-bold transition-all focus-ring-standard",
                          amount === amt 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background border-border text-foreground hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {amt} <span className="text-xs font-normal opacity-80">{t('donate.currency')}</span>
                      </button>
                    ))}
                    <div className="col-span-3 sm:col-span-1 relative h-full">
                      <Label htmlFor="customAmount" className="sr-only">{t('donate.amount.customPlaceholder')}</Label>
                      <Input 
                        id="customAmount"
                        type="number" 
                        min="1"
                        placeholder={t('donate.amount.customPlaceholder')}
                        value={amounts.includes(amount) ? '' : amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={cn(
                          "h-full text-center rounded-2xl",
                          !amounts.includes(amount) && amount !== '' && "border-primary ring-1 ring-primary"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-bold">{t('donate.form.info')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="donorName">{t('donate.form.name')}</Label>
                      <Input id="donorName" type="text" className="rounded-2xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donorPhone">{t('donate.form.phone')}</Label>
                      <Input id="donorPhone" type="tel" required dir="ltr" className="text-start rounded-2xl h-11" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="donorEmail">{t('donate.form.email')}</Label>
                      <Input id="donorEmail" type="email" dir="ltr" className="text-start rounded-2xl h-11" />
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg h-14 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Heart className="w-5 h-5 mx-2" />
                  {t('donate.submit')}
                </Button>
              </form>
            </div>

            {/* Sidebar / Bank Info */}
            <div className="space-y-6">
              <div className="bg-muted border border-border rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-4 text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{t('donate.bankTransfer.title')}</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {t('donate.bankTransfer.desc')}
                </p>
                <div className="space-y-3 bg-background p-4 rounded-xl border border-border text-sm font-mono ltr-safe">
                  <div className="rtl-safe font-sans font-bold text-primary mb-2">
                    {t('donate.bankTransfer.bankName')}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs rtl-safe font-sans">{t('donate.bankTransfer.accountName')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mt-3 mb-1 rtl-safe font-sans">{t('donate.bankTransfer.iban').split(':')[0]}</span>
                    <span className="font-bold text-foreground">{t('donate.bankTransfer.ibanValue')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mt-3 mb-1 rtl-safe font-sans">{t('donate.bankTransfer.swift').split(':')[0]}</span>
                    <span className="font-bold text-foreground">{t('donate.bankTransfer.swiftValue')}</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
