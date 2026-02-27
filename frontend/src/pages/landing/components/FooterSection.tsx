import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Globe, ChevronDown } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export const FooterSection = () => {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-border/40 py-10 md:py-16 text-center text-muted-foreground bg-brand-surface/50 dark:bg-muted/10 relative overflow-hidden">
            {/* Soft decorative blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-primary/5 blur-[100px] -z-10 rounded-[100%]" />

            <div className="container px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card flex items-center justify-center shadow-sm border border-border/60">
                            <Star className="h-6 w-6 text-brand-primary fill-brand-primary" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-foreground text-xl tracking-tight leading-tight">EarlyReviews</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{t('landing.footer.tagline', 'The Review Ecosystem')}</div>
                        </div>
                    </div>

                    {/* Redesigned Language Switcher Container */}
                    <LanguageSwitcher variant="full" />
                </div>

                <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto text-sm">
                    <p className="font-medium">{t('landing.footer.rights', '© 2026 SalesDuo Reviews Programme. All rights reserved.')}</p>
                    <div className="flex gap-8 font-semibold">
                        <a href="/terms" className="hover:text-brand-primary transition-colors">{t('landing.footer.terms', 'Terms of Service')}</a>
                        <a href="/privacy" className="hover:text-brand-primary transition-colors">{t('landing.footer.privacy', 'Privacy Policy')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
