import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, ShoppingBag, Package, TrendingUp, CheckCircle2, Clock, Wallet, Banknote, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
    const { t } = useTranslation();

    return (
        <section className="relative pt-32 bg-brand-surface/25 dark:bg-muted/10 md:pt-40 pb-20 md:pb-32 overflow-hidden">
            {/* Abstract background glow */}
            <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full bg-brand-accent/20 blur-[100px] md:blur-[140px] -z-10 translate-x-1/3 -translate-y-1/3 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-brand-primary/15 blur-[100px] md:blur-[140px] -z-10 -translate-x-1/3 translate-y-1/3" />

            <div className="container px-4">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    <div className="text-center lg:text-left z-10">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 mb-6 text-brand-accent font-semibold text-sm">
                            <Sparkles className="h-4 w-4 mr-2" />
                            <span>The #1 Platform for Top Reviewers</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {t('landing.hero.title')} <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-primary">{t('landing.hero.titleHighlight')}</span>
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-forwards px-4 lg:px-0">
                            {t('landing.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-forwards px-4 lg:px-0">
                            <Button asChild size="lg" className="rounded-full bg-brand-accent hover:bg-brand-dark text-white text-base h-12 md:h-14 w-full sm:w-auto px-8 shadow-xl shadow-brand-accent/30 border-0 transition-all hover:scale-105">
                                <Link to="/signup?role=buyer">
                                    {t('landing.hero.buyerBtn')} <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full text-base h-12 md:h-14 w-full sm:w-auto px-8 bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all hover:scale-105 hover:border-brand-primary/50 text-foreground">
                                <Link to="/signup?role=seller">
                                    {t('landing.hero.sellerBtn')}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Overlapping Dashboards Mockup */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-forwards hidden md:block z-10 perspective-[2000px] h-[550px]">

                        {/* Seller Dashboard (Background layer) */}
                        <div className="absolute right-0 top-0 w-[85%] rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden transform rotate-y-[-10deg] rotate-x-[5deg] translate-z-[-100px] translate-x-12 opacity-80 blur-[1px] hover:blur-none hover:opacity-100 transition-all duration-700 ease-out">
                            {/* Dashboard Header */}
                            <div className="flex justify-between items-center p-3 border-b border-border/30 bg-muted/10">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                        <Package className="h-3 w-3 text-brand-primary" />
                                    </div>
                                    <div className="text-xs font-semibold text-foreground">Seller view</div>
                                </div>
                            </div>
                            <div className="p-4 bg-background/50">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-lg border border-border/30 p-2 bg-muted/5 shadow-sm">
                                        <div className="text-[10px] text-muted-foreground mb-1">Products</div>
                                        <div className="text-lg font-bold text-foreground">12</div>
                                    </div>
                                    <div className="rounded-lg border border-border/30 p-2 bg-muted/5 shadow-sm">
                                        <div className="text-[10px] text-muted-foreground mb-1">Reviews</div>
                                        <div className="text-lg font-bold text-foreground">348</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-2 rounded border border-border/30 bg-card/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-8 w-8 rounded bg-muted"></div>
                                            <div>
                                                <div className="h-2 w-20 bg-muted-foreground/30 rounded mb-1"></div>
                                                <div className="h-2 w-12 bg-muted-foreground/20 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded border border-border/30 bg-card/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-8 w-8 rounded bg-muted"></div>
                                            <div>
                                                <div className="h-2 w-20 bg-muted-foreground/30 rounded mb-1"></div>
                                                <div className="h-2 w-12 bg-muted-foreground/20 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buyer Dashboard (Foreground layer - Hero) */}
                        <div className="absolute left-0 bottom-0 w-[90%] rounded-2xl border border-brand-accent/30 bg-card shadow-2xl overflow-hidden transform rotate-y-[-5deg] rotate-x-[2deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out z-20">
                            {/* Glow behind the front dashboard */}
                            <div className="absolute -inset-1 rounded-3xl bg-brand-accent/20 blur-2xl opacity-50 pointer-events-none"></div>

                            <div className="relative bg-card rounded-2xl h-full flex flex-col">
                                {/* Dashboard Header */}
                                <div className="flex justify-between items-center p-4 border-b border-border/50 bg-brand-accent/5 dark:bg-brand-accent/10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-brand-accent flex items-center justify-center shadow-md shadow-brand-accent/30">
                                            <Wallet className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">Reviewer Dashboard</div>
                                            <div className="text-xs text-brand-accent/80 dark:text-brand-accent/80">Earnings & History</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                            <Star className="h-4 w-4 text-brand-tertiary fill-brand-tertiary" />
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-brand-accent/20 dark:bg-brand-accent/40 flex items-center justify-center border border-brand-accent/30 dark:border-brand-accent/60">
                                            <span className="text-xs font-bold text-brand-accent dark:text-brand-accent">AR</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-background">
                                    {/* Top Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="rounded-xl border border-border/50 p-3 bg-muted/10 shadow-sm relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Banknote className="w-16 h-16 text-brand-primary" /></div>
                                            <div className="text-xs text-muted-foreground mb-1 relative z-10">Total Reimbursed</div>
                                            <div className="text-2xl font-bold text-brand-primary dark:text-brand-primary relative z-10">$1,245<span className="text-sm font-medium text-muted-foreground">.50</span></div>
                                        </div>
                                        <div className="rounded-xl border border-border/50 p-3 bg-muted/10 shadow-sm relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-16 h-16 text-brand-accent" /></div>
                                            <div className="text-xs text-muted-foreground mb-1 relative z-10">Approved Reviews</div>
                                            <div className="text-2xl font-bold relative z-10">42</div>
                                        </div>
                                        <div className="rounded-xl border border-border/50 p-3 bg-brand-secondary/5 border-brand-secondary/20 shadow-sm relative overflow-hidden">
                                            <div className="text-xs text-brand-secondary dark:text-brand-secondary mb-1">Pending Payouts</div>
                                            <div className="text-2xl font-bold text-brand-secondary dark:text-brand-secondary">$128.00</div>
                                            <div className="text-[10px] text-brand-secondary/80 flex items-center mt-1"><Clock className="h-3 w-3 mr-1" /> Est. 2 days</div>
                                        </div>
                                    </div>

                                    {/* Recent Purchases */}
                                    <div className="mb-2">
                                        <div className="text-sm font-bold mb-3 flex items-center justify-between text-foreground/80">
                                            <span>Recent Reimbursements</span>
                                            <span className="text-xs text-brand-accent hover:text-brand-dark cursor-pointer transition-colors">View All</span>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Product 1 */}
                                            <div className="p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors flex justify-between items-center shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                                                        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80" alt="Product" className="object-cover w-full h-full" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold leading-none mb-1 text-foreground/90">Premium Headphones</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Verified Purchase</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-brand-primary">+$299.00</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center justify-end">
                                                        <CheckCircle2 className="h-3 w-3 mr-1 text-brand-primary" /> Paid
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Product 2 */}
                                            <div className="p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors flex justify-between items-center shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                                                        <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80" alt="Product" className="object-cover w-full h-full" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold leading-none mb-1 text-foreground/90">Running Shoes</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Review Submitted</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-brand-secondary">+$120.00</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center justify-end">
                                                        <Clock className="h-3 w-3 mr-1 text-brand-secondary" /> Pending
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
