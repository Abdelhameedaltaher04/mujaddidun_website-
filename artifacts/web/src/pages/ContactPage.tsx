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
              <h2 className="text-2xl font-bold font-display mb-6">{t('common.contactDesc')}</h2>
              
              <div className="space-y-6 mt-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('footer.address')}</h3>
                    <p className="text-muted-foreground mt-1">{t('contact.addressValue')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('footer.phone')}</h3>
                    <p className="text-muted-foreground mt-1" dir="ltr">+962 6 123 4567</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('footer.email')}</h3>
                    <p className="text-muted-foreground mt-1">info@mujaddidun.org</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('common.firstName')}</Label>
                    <Input id="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('common.lastName')}</Label>
                    <Input id="lastName" required />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input id="email" type="email" required dir="ltr" className="text-start" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('common.phone')}</Label>
                    <Input id="phone" type="tel" dir="ltr" className="text-start" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">{t('common.message')}</Label>
                  <Textarea id="message" rows={5} required />
                </div>
                
                <Button type="submit" className="w-full">{t('common.send')}</Button>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
