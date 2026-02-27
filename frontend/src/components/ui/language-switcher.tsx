import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    zh: '中文',
    pt: 'Português',
    it: 'Italiano',
    nl: 'Nederlands',
    pl: 'Polski',
    sv: 'Svenska',
    tr: 'Türkçe',
    ar: 'العربية',
    hi: 'हिन्दी'
};

interface LanguageSwitcherProps {
    variant?: 'icon' | 'full';
}

export const LanguageSwitcher = ({ variant = 'icon' }: LanguageSwitcherProps) => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {variant === 'full' ? (
                    <button className="flex items-center gap-2 bg-white dark:bg-card rounded-2xl p-2 pr-3 border border-border/60 shadow-md ring-1 ring-border/50 hover:ring-brand-primary/20 transition-all outline-none">
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl">
                            <Globe className="h-4 w-4 text-foreground/70" />
                            <span className="text-sm font-bold text-foreground/80">{t('landing.footer.language', 'Language')}</span>
                        </div>
                        <div className="pl-1 flex items-center gap-1 hover:text-brand-primary transition-colors text-sm font-medium text-foreground/80">
                            <span className="text-sm font-bold text-foreground/80">
                                {LANGUAGE_NAMES[i18n.language ? i18n.language.split('-')[0] : 'en'] || 'English'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50 outline-none">
                        <Globe className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                        <span className="sr-only">Toggle language</span>
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className={`cursor-pointer rounded-lg ${i18n.language.startsWith('en') ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('es')}
                    className={`cursor-pointer rounded-lg ${i18n.language.startsWith('es') ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                    Español
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
