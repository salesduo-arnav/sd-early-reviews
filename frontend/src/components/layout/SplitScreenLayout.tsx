import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export interface SplitScreenLayoutProps {
    children: React.ReactNode;
    leftContent: {
        title: string;
        subtitle: string;
        features: { title: string; description: string }[];
    };
}

export function SplitScreenLayout({ children, leftContent }: SplitScreenLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Panel */}
            <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-brand-primary to-primary flex-col justify-between p-0 text-white overflow-hidden shadow-2xl z-10">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}></div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[100px]" />
                </div>

                <Link to="/" className="relative z-10 flex items-center space-x-3 w-fit hover:opacity-90 transition-opacity p-8">
                    <div className="w-8 h-8 rounded-xl bg-brand-tertiary text-brand-primary flex items-center justify-center font-bold text-2xl shadow-lg">
                        <Star className="text-primary fill-brand-tertiary h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight">EarlyReviews</span>
                </Link>

                <div className="relative z-10 max-w-xl self-center w-full py-8">
                    <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        {leftContent.title}
                    </h1>
                    <p className="text-lg xl:text-xl text-white/90 mb-12 leading-relaxed">
                        {leftContent.subtitle}
                    </p>

                    <div className="space-y-8">
                        {leftContent.features.map((feature, index) => (
                            <div key={index} className="flex items-start group">
                                <div className="mt-1 bg-white/20 p-2 rounded-full mr-5 group-hover:bg-white/30 transition-all duration-300 shadow-sm shadow-black/5">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 tracking-wide">{feature.title}</h3>
                                    <p className="text-white/80 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto px-8 py-4">
                    <div className="text-sm font-medium text-white/70">
                        © {new Date().getFullYear()} SalesDuo. {t('auth.all_rights_reserved', 'All rights reserved.')}
                    </div>
                    <LanguageSwitcher variant="auth" />
                </div>
            </div>

            {/* Right Panel (Form area) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto bg-background">
                {/* Mobile Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-2xl shadow-md">
                        S
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">SalesDuo</span>
                </div>
                <div className="w-full max-w-md mx-auto relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
