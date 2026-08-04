import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FormEvent } from 'react';

export default function ContactPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: t('common.success'),
      description: t('common.sendMsgSuccess'),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('contact.title')} 
        description={t('contact.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('contact.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold font-display mb-6">{t('common.contactDesc')}</h2>
              
              <div className="space-y-6 mt-8 bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 group">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">{t('footer.address')}</h3>
                    <p className="text-muted-foreground">{t('contact.addressValue')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="p-4 bg-secondary/10 text-secondary rounded-2xl shrink-0 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">{t('footer.phone')}</h3>
                    <p className="text-muted-foreground ltr-safe block" dir="ltr">+962 6 123 4567</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="p-4 bg-info/10 text-info rounded-2xl shrink-0 group-hover:bg-info group-hover:text-info-foreground transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">{t('footer.email')}</h3>
                    <p className="text-muted-foreground ltr-safe block" dir="ltr">info@mujaddidun.org</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('common.firstName')}</Label>
                    <Input id="firstName" required className="rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('common.lastName')}</Label>
                    <Input id="lastName" required className="rounded-xl bg-background" />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input id="email" type="email" required dir="ltr" className="text-start rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('common.phone')}</Label>
                    <Input id="phone" type="tel" dir="ltr" className="text-start rounded-xl bg-background" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">{t('common.message')}</Label>
                  <Textarea id="message" rows={5} required className="rounded-xl bg-background resize-none" />
                </div>
                
                <Button type="submit" size="lg" className="w-full h-12 rounded-xl text-lg font-bold">{t('common.send')}</Button>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
