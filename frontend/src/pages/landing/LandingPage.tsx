import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ShieldCheck, TrendingUp, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <nav className="fixed top-0 left-0 right-0 h-20 flex items-center z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container px-4 flex justify-between items-center h-full">
                    <Link to="/" className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold tracking-tight">
                        <Star className="text-primary fill-primary h-6 w-6 md:h-7 md:w-7" />
                        <span>EarlyReviews</span>
                    </Link>
                    <div className="flex items-center gap-2 md:gap-4 hover:cursor-pointer">

                        <LanguageSwitcher />

                        <Button variant="ghost" asChild className="hidden sm:inline-flex rounded-full">
                            <Link to="/login">{t('landing.nav.logIn')}</Link>
                        </Button>
                        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 border-0">
                            <Link to="/signup">{t('landing.nav.getStarted')}</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 overflow-hidden">
                {/* Abstract background glow */}
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full bg-primary/10 blur-[80px] md:blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-blue-500/10 blur-[80px] md:blur-[120px] -z-10 -translate-x-1/3 translate-y-1/3" />

                <div className="container px-4">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div className="text-center lg:text-left z-10">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                {t('landing.hero.title')} <br className="hidden sm:block" />
                                <span className="text-brand-gradient">{t('landing.hero.titleHighlight')}</span>
                            </h1>
                            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-forwards px-4 lg:px-0">
                                {t('landing.hero.subtitle')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-forwards px-4 lg:px-0">
                                <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12 md:h-14 w-full sm:w-auto px-8 shadow-brand-md border-0 transition-all hover:scale-105">
                                    <Link to="/signup?role=buyer">
                                        {t('landing.hero.buyerBtn')} <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="rounded-full text-base h-12 md:h-14 w-full sm:w-auto px-8 bg-background/50 backdrop-blur-sm border-border hover:bg-accent/50 transition-all hover:scale-105">
                                    <Link to="/signup?role=seller">
                                        {t('landing.hero.sellerBtn')}
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Beautiful Tailwind CSS Mockup */}
                        <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-forwards hidden md:block z-10">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-brand blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl p-4 sm:p-6 overflow-hidden">
                                {/* Mock UI Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Star className="h-5 w-5 text-primary fill-primary" />
                                        </div>
                                        <div>
                                            <div className="h-4 w-24 bg-foreground/20 rounded mb-2"></div>
                                            <div className="h-3 w-16 bg-muted-foreground/30 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                                        <div className="h-8 w-8 rounded-full border border-border bg-background"></div>
                                    </div>
                                </div>

                                {/* Mock Chart Area */}
                                <div className="rounded-xl border border-border/50 bg-background/50 p-4 mb-4">
                                    <div className="h-4 w-32 bg-foreground/20 rounded mb-4"></div>
                                    <div className="flex items-end gap-2 h-32 mt-4">
                                        {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                                            <div key={i} className="flex-1 rounded-t-sm bg-primary/80 transition-all duration-1000 ease-out hover:bg-primary" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mock List Items */}
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-3 w-28 bg-foreground/30 rounded"></div>
                                                    <div className="h-2 w-16 bg-muted-foreground/40 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-6 w-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                <div className="h-2 w-10 bg-green-500/70 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Banner */}
            <div className="border-y border-border/40 bg-muted/20 backdrop-blur-sm relative z-20">
                <div className="container px-4 py-10 md:py-14">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/30">
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-forwards relative group">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">{t('landing.stats.verifiedReviewsValue')}</h4>
                            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">{t('landing.stats.verifiedReviews')}</p>
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards relative group">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">{t('landing.stats.activeReviewersValue')}</h4>
                            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">{t('landing.stats.activeReviewers')}</p>
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards relative group">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">{t('landing.stats.productsTestedValue')}</h4>
                            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">{t('landing.stats.productsTested')}</p>
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-forwards border-l-0 md:border-l relative group">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">{t('landing.stats.reimbursementTimeValue')}</h4>
                            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">{t('landing.stats.reimbursementTime')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Types Section */}
            <section className="relative py-20 md:py-32 bg-muted/30 border-y border-border/50 overflow-hidden" id="how-it-works">
                {/* Decorative background circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px] -z-10 pointer-events-none" />

                <div className="container px-4 relative z-10">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-3 block">{t('landing.howItWorks.subtitle')}</span>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4">{t('landing.howItWorks.title')}</h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-8 md:mt-12">
                        {/* Seller Card */}
                        <div className="relative p-8 md:p-12 rounded-[2rem] bg-card border border-border bg-gradient-to-br from-card to-card/50 shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-brand-sm">
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                <TrendingUp className="w-64 h-64 text-primary" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                                    <TrendingUp className="text-primary h-8 w-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                    {t('landing.howItWorks.seller.title')}
                                </h3>
                                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                    {t('landing.howItWorks.seller.description')}
                                </p>

                                <ul className="space-y-4 md:space-y-5">
                                    {(t('landing.howItWorks.seller.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-4 text-foreground text-base font-medium">
                                            <div className="mt-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="text-primary h-4 w-4" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Buyer Card */}
                        <div className="relative p-8 md:p-12 rounded-[2rem] bg-card border border-border bg-gradient-to-br from-card to-card/50 shadow-sm overflow-hidden group hover:border-blue-500/50 transition-all duration-500 hover:shadow-lg">
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                <ShoppingBag className="w-64 h-64 text-blue-500" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
                                    <ShoppingBag className="text-blue-500 h-8 w-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                    {t('landing.howItWorks.buyer.title')}
                                </h3>
                                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                    {t('landing.howItWorks.buyer.description')}
                                </p>

                                <ul className="space-y-4 md:space-y-5">
                                    {(t('landing.howItWorks.buyer.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-4 text-foreground text-base font-medium">
                                            <div className="mt-1 h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="text-blue-500 h-4 w-4" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 md:py-32 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

                <div className="container px-4">
                    <div className="text-center mb-12 md:mb-20">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-3 block">Benefits</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">{t('landing.features.title')}</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
                        <div className="relative p-8 md:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:-translate-y-2 transition-all duration-300 group hover:shadow-lg hover:border-primary/30 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110 duration-500" />
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <ShieldCheck className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3">{t('landing.features.secure.title')}</h3>
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                {t('landing.features.secure.description')}
                            </p>
                        </div>

                        <div className="relative p-8 md:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:-translate-y-2 transition-all duration-300 group hover:shadow-lg hover:border-sidebar-primary/30 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sidebar-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110 duration-500" />
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary mb-6 ring-1 ring-sidebar-primary/20 group-hover:bg-sidebar-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <Star className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3">{t('landing.features.anonymous.title')}</h3>
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                {t('landing.features.anonymous.description')}
                            </p>
                        </div>

                        <div className="relative p-8 md:p-10 rounded-[2rem] bg-card border border-border shadow-sm hover:-translate-y-2 transition-all duration-300 group hover:shadow-lg hover:border-emerald-500/30 overflow-hidden sm:col-span-2 md:col-span-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110 duration-500" />
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <TrendingUp className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3">{t('landing.features.analytics.title')}</h3>
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                {t('landing.features.analytics.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8 md:py-12 text-center text-muted-foreground">
                <div className="container px-4">
                    <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                        <Star className="h-4 w-4 md:h-5 md:w-5 text-primary fill-primary" />
                        <span className="font-bold text-foreground tracking-tight text-sm md:text-base">EarlyReviews</span>
                    </div>
                    <p className="text-xs md:text-sm">{t('landing.footer.rights')}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
