import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { FeaturesSection } from './components/FeaturesSection';
import { FooterSection } from './components/FooterSection';

const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Minimal and clean Header. Language Switcher moved to Footer */}
            <nav className="fixed top-0 left-0 right-0 h-20 flex items-center z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container px-4 flex justify-between items-center h-full">
                    <Link to="/" className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold tracking-tight group">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Star className="text-primary fill-primary h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <span>EarlyReviews</span>
                    </Link>
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" asChild className="hidden sm:inline-flex rounded-full text-sm font-semibold px-6 hover:bg-muted/50 transition-colors">
                            <Link to="/login">{t('landing.nav.logIn', 'Log In')}</Link>
                        </Button>
                        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-brand-sm border-0 px-6 font-semibold transition-transform hover:scale-105">
                            <Link to="/signup">{t('landing.nav.getStarted', 'Get Started')}</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <HeroSection />
            <StatsSection />
            <HowItWorksSection />
            <FeaturesSection />
            <FooterSection />
        </div>
    );
};

export default LandingPage;
