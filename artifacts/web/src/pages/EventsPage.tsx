import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';

export default function EventsPage() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<number | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);

  const handleRegisterClick = (eventId: number) => {
    if (registeredEvents.includes(eventId)) return;
    setPendingEvent(eventId);
    if (isAuthenticated) {
      setSuccessOpen(true);
    } else {
      setLoginPromptOpen(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    if (pendingEvent !== null) {
      setRegisteredEvents((prev) =>
        prev.includes(pendingEvent) ? prev : [...prev, pendingEvent],
      );
    }
    setPendingEvent(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('events.title')} 
        description={t('events.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('events.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="upcoming">{t('events.upcoming')}</TabsTrigger>
                <TabsTrigger value="past">{t('events.past')}</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming">
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                   <div key={i} className="flex gap-4 p-6 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group overflow-hidden">
                      <div className="w-20 h-20 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                         <span className="text-2xl font-bold font-display leading-none">{t(`events.items.${i}.day`)}</span>
                         <span className="text-sm font-medium">{t(`events.items.${i}.month`)}</span>
                      </div>
                      <div className="flex flex-col flex-1">
                         <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors">{t(`events.items.${i}.title`)}</h3>
                         <div className="text-sm text-muted-foreground flex gap-3 mb-3">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t(`events.items.${i}.location`)}</span>
                         </div>
                         <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{t(`events.items.${i}.desc`)}</p>
                         <Button
                            variant="outline"
                            disabled={registeredEvents.includes(i)}
                            onClick={() => handleRegisterClick(i)}
                            className="self-start group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors disabled:opacity-100 disabled:bg-success/10 disabled:text-success disabled:border-success/40 disabled:group-hover:bg-success/10 disabled:group-hover:text-success disabled:group-hover:border-success/40"
                            data-testid={`button-register-event-${i}`}
                         >
                            {registeredEvents.includes(i)
                              ? t('events.register.registered')
                              : t('home.events.register')}
                         </Button>
                      </div>
                   </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="past">
               <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">{t('events.empty')}</p>
              </div>
            </TabsContent>
          </Tabs>
        </SectionWrapper>
      </main>
      <Footer />

      {/* Login required dialog (guests) */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-login-required">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('events.register.loginRequiredTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('events.register.loginRequiredMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setLoginPromptOpen(false)}
              data-testid="button-dialog-cancel"
            >
              {t('events.register.cancelBtn')}
            </Button>
            <Button
              onClick={() => {
                setLoginPromptOpen(false);
                navigate('/login');
              }}
              data-testid="button-dialog-login"
            >
              {t('events.register.loginBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration success dialog (authenticated users) */}
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) handleSuccessClose();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-register-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('events.register.successTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('events.register.successMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button onClick={handleSuccessClose} data-testid="button-dialog-ok">
              {t('events.register.okBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
