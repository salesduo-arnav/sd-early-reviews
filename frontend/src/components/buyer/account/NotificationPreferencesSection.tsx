import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

interface NotificationPreferencesSectionProps {
    enabled: boolean;
    loading: boolean;
    onToggle: (enabled: boolean) => void;
}

export default function NotificationPreferencesSection({ enabled, loading, onToggle }: NotificationPreferencesSectionProps) {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm border-border">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-50">
                        <Bell className="h-4 w-4 text-amber-600" />
                    </div>
                    <CardTitle className="text-lg">
                        {t('buyer.account.notifications.title', 'Notification Preferences')}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">
                            {t('buyer.account.notifications.email_label', 'Email Notifications')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('buyer.account.notifications.email_description', 'Receive email alerts for order updates, review approvals, and payouts')}
                        </p>
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 w-10 rounded-full" />
                    ) : (
                        <Switch
                            checked={enabled}
                            onCheckedChange={onToggle}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
