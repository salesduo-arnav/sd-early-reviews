import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Star, TrendingUp } from 'lucide-react';

export const FeaturesSection = () => {
    const { t } = useTranslation();

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-background">
            <div className="absolute top-0 right-0 -translate-y-1/2 w-full h-[600px] bg-gradient-to-b from-brand-primary/5 to-transparent -z-10" />

            <div className="container px-4">
                <div className="text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-accent border border-border mb-6">
                        <span className="text-foreground font-bold tracking-wider uppercase text-sm">Platform Benefits</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">{t('landing.features.title', 'Built for trust and scale')}</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    {/* Feature 1 */}
                    <div className="relative p-10 rounded-[2rem] bg-card border border-border/80 shadow-md hover:-translate-y-2 transition-all duration-500 group hover:shadow-xl hover:border-brand-primary/40 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-brand-primary/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-700" />

                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center text-brand-primary mb-8 ring-1 ring-brand-primary/30 group-hover:bg-brand-primary group-hover:text-primary-foreground group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                            <ShieldCheck className="h-8 w-8 md:h-10 md:w-10" />
                        </div>

                        <h3 className="text-2xl font-bold mb-4">{t('landing.features.secure.title', 'Secure Verification')}</h3>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            {t('landing.features.secure.description', 'Every purchase and review is manually or automatically verified against strict guidelines to ensure 100% compliance and authenticity.')}
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="relative p-10 rounded-[2rem] bg-card border border-border/80 shadow-md hover:-translate-y-2 transition-all duration-500 group hover:shadow-xl hover:border-brand-accent/40 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-brand-accent/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-700" />

                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 flex items-center justify-center text-brand-accent mb-8 ring-1 ring-brand-accent/30 group-hover:bg-brand-accent group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-inner">
                            <Star className="h-8 w-8 md:h-10 md:w-10" />
                        </div>

                        <h3 className="text-2xl font-bold mb-4">{t('landing.features.anonymous.title', 'High Quality Assets')}</h3>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            {t('landing.features.anonymous.description', 'Our community of vetted reviewers provides thoughtful, authentic feedback to help buyers make informed decisions.')}
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="relative p-10 rounded-[2rem] bg-card border border-border/80 shadow-md hover:-translate-y-2 transition-all duration-500 group hover:shadow-xl hover:border-brand-tertiary/40 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-brand-tertiary/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-700" />

                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-brand-tertiary/20 to-brand-tertiary/5 flex items-center justify-center text-brand-tertiary mb-8 ring-1 ring-brand-tertiary/30 group-hover:bg-brand-tertiary group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-inner">
                            <TrendingUp className="h-8 w-8 md:h-10 md:w-10" />
                        </div>

                        <h3 className="text-2xl font-bold mb-4">{t('landing.features.analytics.title', 'Insightful Analytics')}</h3>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            {t('landing.features.analytics.description', 'Track campaign completion rates, monitor reimbursements, and gain actionable insights from review performance over time.')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
