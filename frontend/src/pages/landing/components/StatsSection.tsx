import React from 'react';
import { useTranslation } from 'react-i18next';

export const StatsSection = () => {
    const { t } = useTranslation();

    return (
        <div className="border-y border-border/40 bg-card/50 backdrop-blur-md relative z-20 overflow-hidden shadow-sm">
            {/* Subtle animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 via-transparent to-brand-primary/5 opacity-80"></div>

            <div className="container px-4 py-12 md:py-16 relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/30">
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-forwards relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <h4 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-accent to-brand-primary drop-shadow-sm">
                            {t('landing.stats.verifiedReviewsValue', '50K+')}
                        </h4>
                        <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                            {t('landing.stats.verifiedReviews')}
                        </p>
                    </div>

                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <h4 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-primary to-brand-tertiary drop-shadow-sm">
                            {t('landing.stats.activeReviewersValue', '10K+')}
                        </h4>
                        <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                            {t('landing.stats.activeReviewers')}
                        </p>
                    </div>

                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-tertiary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <h4 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-tertiary to-brand-primary drop-shadow-sm">
                            {t('landing.stats.productsTestedValue', '5K+')}
                        </h4>
                        <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                            {t('landing.stats.productsTested')}
                        </p>
                    </div>

                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-forwards border-l-0 md:border-l relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-secondary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <h4 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-secondary to-brand-accent drop-shadow-sm">
                            {t('landing.stats.reimbursementTimeValue', '48h')}
                        </h4>
                        <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                            {t('landing.stats.reimbursementTime')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
