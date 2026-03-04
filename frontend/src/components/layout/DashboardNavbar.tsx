import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Star, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

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

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 flex items-center z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container md:px-6 flex justify-between items-center h-full max-w-7xl">
                <Link to={isBuyer ? '/buyer' : isSeller ? '/seller' : '/'} className="flex items-center gap-2 font-bold tracking-tight text-lg">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Star className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <span>{isBuyer ? t('nav.buyer_dashboard', 'Buyer Dashboard') : isSeller ? t('nav.seller_dashboard', 'Seller Dashboard') : 'SalesDuo'}</span>
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

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{user?.email}</span>
                    </div>
                    <NotificationBell />
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('nav.logout', 'Log out')}
                    </Button>
                </div>
            </div>
        </nav>
    );
}
