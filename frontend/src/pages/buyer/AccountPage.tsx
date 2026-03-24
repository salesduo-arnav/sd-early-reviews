import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { buyerApi } from '@/api/buyer';
import type { BuyerProfile } from '@/api/buyer';
import ProfileStatsSection from '@/components/buyer/account/ProfileStatsSection';
import BankAccountSection from '@/components/buyer/account/BankAccountSection';
import NotificationPreferencesSection from '@/components/buyer/account/NotificationPreferencesSection';

export default function AccountPage() {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<BuyerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await buyerApi.getAccountProfile();
            setProfile(data);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleNotificationToggle = async (enabled: boolean) => {
        // Optimistic update
        const previous = profile?.email_notifications_enabled;
        setProfile((prev) => prev ? { ...prev, email_notifications_enabled: enabled } : prev);

        try {
            await buyerApi.updateNotificationPreferences(enabled);
            toast.success(enabled
                ? t('buyer.account.notifications.enabled_success', 'Email notifications enabled')
                : t('buyer.account.notifications.disabled_success', 'Email notifications disabled'));
        } catch (err) {
            // Rollback
            setProfile((prev) => prev ? { ...prev, email_notifications_enabled: previous ?? true } : prev);
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.account.title', 'Profile & Earnings')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.account.subtitle', 'Track your performance, manage bank details, and view your earnings.')}
                </p>
            </div>

            {/* Profile Health Stats */}
            <ProfileStatsSection profile={profile} loading={loading} />

            {/* 2-column layout: Left (Amazon + Notifications) | Right (Bank Account) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left column */}
                <div className="space-y-6">
                    {/* Amazon Profile URL */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-brand-primary/10">
                                    <LinkIcon className="h-4 w-4 text-brand-primary" />
                                </div>
                                <CardTitle className="text-lg">{t('buyer.account.amazon_profile.title', 'Amazon Profile')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={profile?.amazon_profile_url ?? ''}
                                        readOnly
                                        disabled
                                        className="flex-1"
                                    />
                                    {profile?.amazon_profile_url && (
                                        <a
                                            href={profile.amazon_profile_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" size="icon">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <NotificationPreferencesSection
                        enabled={profile?.email_notifications_enabled ?? true}
                        loading={loading}
                        onToggle={handleNotificationToggle}
                    />
                </div>

                {/* Right column — Bank Account */}
                <BankAccountSection
                    wiseConnected={profile?.wise_connected ?? false}
                    payoutCurrency={profile?.payout_currency ?? null}
                    payoutCountry={profile?.payout_country ?? null}
                    bankDisplayLabel={profile?.bank_display_label ?? null}
                    loading={loading}
                    onConnected={fetchProfile}
                    onDisconnected={fetchProfile}
                />
            </div>
        </div>
    );
}
