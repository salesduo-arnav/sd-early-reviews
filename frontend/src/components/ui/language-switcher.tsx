import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50">
                    <Globe className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    <span className="sr-only">Toggle language</span>
                </Button>
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
