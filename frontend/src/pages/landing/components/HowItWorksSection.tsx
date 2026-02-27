import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingBag, CheckCircle2, Sparkles } from 'lucide-react';

export const HowItWorksSection = () => {
    const { t } = useTranslation();

    const sellerFeatures = (t('landing.howItWorks.seller.features', { returnObjects: true }) as string[]) || [
        "Commit units for reviews upfront",
        "Set custom reimbursement percentages",
        "Track review completions and campaign progress",
        "View detailed analytics and billing history"
    ];

    const buyerFeatures = (t('landing.howItWorks.buyer.features', { returnObjects: true }) as string[]) || [
        "Browse and purchase exclusive products",
        "Upload order & review proof for verification",
        "Build your reviewer profile to unlock more",
        "Get fast, guaranteed reimbursements"
    ];

    return (
        <section className="relative py-24 md:py-32 bg-brand-surface dark:bg-muted/10 border-y border-border/50 overflow-hidden" id="how-it-works">
            {/* Decorative background curves/glows */}
            <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-brand-primary/10 blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-[-10%] -right-32 w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[120px] -z-10 pointer-events-none" />

            <div className="container px-4 relative z-10">
                <div className="text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white dark:bg-card border border-border/50 shadow-sm mb-6">
                        <Sparkles className="h-4 w-4 text-brand-primary mr-2" />
                        <span className="text-foreground font-bold tracking-wider uppercase text-sm">{t('landing.howItWorks.subtitle', 'How It Works')}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6 text-foreground">
                        {t('landing.howItWorks.title', 'Two sides of a perfect ecosystem')}
                    </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-8 md:mt-12">
                    {/* Buyer Card - Emphasized */}
                    <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-card border-2 border-brand-accent/20 shadow-xl overflow-hidden group hover:border-brand-accent/50 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 order-1">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-700" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12">
                            <ShoppingBag className="w-64 h-64 text-brand-accent" />
                        </div>

                        <div className="relative z-10">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-dark flex items-center justify-center mb-8 shadow-lg shadow-brand-accent/30 group-hover:scale-110 transition-transform duration-500">
                                <ShoppingBag className="text-white h-10 w-10" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                                {t('landing.howItWorks.buyer.title', 'For Reviewers')}
                            </h3>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
                                {t('landing.howItWorks.buyer.description', 'Get fully or partially reimbursed for discovering and sharing your thoughts on great new products.')}
                            </p>

                            <ul className="space-y-4 md:space-y-5">
                                {buyerFeatures.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-4 text-foreground text-base font-semibold group/item relative">
                                        <div className="mt-1 h-6 w-6 rounded-full bg-brand-accent/10 dark:bg-brand-accent/30 flex items-center justify-center shrink-0 border border-brand-accent/20 dark:border-brand-accent/80 group-hover/item:border-brand-accent group-hover/item:bg-brand-accent transition-colors duration-300">
                                            <CheckCircle2 className="h-4 w-4 text-brand-accent dark:text-brand-accent group-hover/item:text-white transition-colors" />
                                        </div>
                                        <span className="group-hover/item:text-brand-accent transition-colors duration-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Seller Card */}
                    <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-white/70 dark:bg-card/70 backdrop-blur-sm border border-border/40 shadow-lg overflow-hidden group hover:border-brand-primary/40 transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 lg:scale-95 lg:hover:scale-100 order-2">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-125 duration-700" />
                        <div className="absolute -right-16 -bottom-16 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12">
                            <TrendingUp className="w-80 h-80 text-brand-primary" />
                        </div>

                        <div className="relative z-10">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center mb-8 border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                <TrendingUp className="text-brand-primary h-10 w-10" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground/90">
                                {t('landing.howItWorks.seller.title', 'For Sellers')}
                            </h3>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
                                {t('landing.howItWorks.seller.description', 'Boost your product visibility and credibility with verified authentic reviews.')}
                            </p>

                            <ul className="space-y-4 md:space-y-5">
                                {sellerFeatures.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-4 text-foreground/80 text-base font-medium group/item relative">
                                        <div className="mt-1 h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20 group-hover/item:bg-brand-primary group-hover/item:border-brand-primary transition-colors duration-300">
                                            <CheckCircle2 className="h-4 w-4 text-brand-primary group-hover/item:text-primary-foreground transition-colors" />
                                        </div>
                                        <span className="group-hover/item:text-brand-primary transition-colors duration-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
