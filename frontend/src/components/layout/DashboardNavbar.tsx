import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Star, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export interface NavItem {
    label: string;
    href: string;
}

export interface DashboardNavbarProps {
    links?: NavItem[];
}

export function DashboardNavbar({ links = [] }: DashboardNavbarProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isBuyer = user?.role === 'BUYER';
    const isSeller = user?.role === 'SELLER';
    const isAdmin = user?.role === 'ADMIN';

    const homeLink = isAdmin ? '/admin' : isBuyer ? '/buyer' : isSeller ? '/seller' : '/';
    const dashboardLabel = isAdmin ? 'Admin Panel' : isBuyer ? t('nav.buyer_dashboard', 'Buyer Dashboard') : isSeller ? t('nav.seller_dashboard', 'Seller Dashboard') : 'SalesDuo';

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 flex items-center z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-4 md:px-8 flex justify-between items-center h-full">
                <Link to={homeLink} className="flex items-center gap-2 font-bold tracking-tight text-lg">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Star className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <span>{dashboardLabel}</span>
                </Link>

                {links.length > 0 && (
                    <div className="hidden md:flex flex-1 items-center justify-center gap-6">
                        {links.map((link) => {
                            const isActive = location.pathname.startsWith(link.href) &&
                                (link.href !== '/buyer' && link.href !== '/seller' || location.pathname === link.href);

                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`text-sm font-medium transition-colors hover:text-foreground ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <NotificationBell />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted/50 rounded-full md:rounded-md">
                                <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <span className="hidden md:block text-sm font-medium text-muted-foreground mr-1">
                                    {user?.email?.split('@')[0] || t('nav.profile', 'Profile')}
                                </span>
                                <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{t('nav.account', 'My Account')}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <LanguageSwitcher variant="menu-item" />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{t('nav.logout', 'Log out')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
