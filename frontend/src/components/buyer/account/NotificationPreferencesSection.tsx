import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Bell, Megaphone, ChevronDown, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPreferencesSectionProps {
    emailEnabled: boolean;
    campaignNotificationsEnabled: boolean;
    campaignAlertsGloballyEnabled: boolean;
    /** null = subscribed to all, string[] = specific selection */
    interestedCategories: string[] | null;
    availableCategories: string[];
    loading: boolean;
    onToggleEmail: (enabled: boolean) => void;
    onToggleCampaignNotifications: (enabled: boolean) => void;
    onUpdateInterests: (categories: string[] | null) => void;
}

export default function NotificationPreferencesSection({
    emailEnabled,
    campaignNotificationsEnabled,
    campaignAlertsGloballyEnabled,
    interestedCategories,
    availableCategories,
    loading,
    onToggleEmail,
    onToggleCampaignNotifications,
    onUpdateInterests,
}: NotificationPreferencesSectionProps) {
    const { t } = useTranslation();
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

    // null = subscribed to ALL categories (default / never configured).
    // string[] = specific selection.
    const isSubscribedToAll = interestedCategories === null;
    const selected = interestedCategories ?? [];

    const handleToggleCategory = (category: string) => {
        if (isSubscribedToAll) {
            // Switching from "all" to specific: select all except the toggled one
            const allExcept = availableCategories.filter((c) => c !== category);
            onUpdateInterests(allExcept);
        } else {
            const updated = selected.includes(category)
                ? selected.filter((c) => c !== category)
                : [...selected, category];
            // If they re-selected everything, go back to null (= all)
            if (updated.length >= availableCategories.length && availableCategories.every((c) => updated.includes(c))) {
                onUpdateInterests(null);
            } else {
                onUpdateInterests(updated);
            }
        }
    };

    const handleRemoveCategory = (category: string) => {
        const updated = selected.filter((c) => c !== category);
        onUpdateInterests(updated);
    };

    const handleResetToAll = () => {
        onUpdateInterests(null);
    };

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
            <CardContent className="space-y-4">
                {/* Email Notifications Toggle */}
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
                            checked={emailEnabled}
                            onCheckedChange={onToggleEmail}
                        />
                    )}
                </div>

                <Separator />

                {/* New Campaign Alerts Toggle */}
                <div className={`flex items-center justify-between ${!campaignAlertsGloballyEnabled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {t('buyer.account.notifications.campaign_alerts_label', 'New Campaign Alerts')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {campaignAlertsGloballyEnabled
                                    ? t('buyer.account.notifications.campaign_alerts_description', 'Get notified when new campaigns go live on the marketplace')
                                    : t('buyer.account.notifications.campaign_alerts_disabled', 'Campaign alerts are currently disabled by the platform. No notifications will be sent.')}
                            </p>
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 w-10 rounded-full" />
                    ) : (
                        <Switch
                            checked={campaignNotificationsEnabled}
                            onCheckedChange={onToggleCampaignNotifications}
                            disabled={!campaignAlertsGloballyEnabled}
                        />
                    )}
                </div>

                {/* Category filter (shown when campaign alerts enabled and globally available) */}
                {campaignNotificationsEnabled && campaignAlertsGloballyEnabled && !loading && (
                    <div className="pl-6 space-y-3">
                        <div>
                            <p className="text-sm font-medium">
                                {t('buyer.account.notifications.interests_label', 'Category Filter')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isSubscribedToAll
                                    ? t('buyer.account.notifications.interests_all', 'You are subscribed to all categories. Select specific ones to narrow down.')
                                    : t('buyer.account.notifications.interests_filtered', 'You will only be notified for the selected categories.')}
                            </p>
                        </div>

                        {/* Category Picker */}
                        <Popover open={categoryPickerOpen} onOpenChange={setCategoryPickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between text-sm font-normal"
                                >
                                    {isSubscribedToAll
                                        ? t('buyer.account.notifications.interests_all_label', 'All categories')
                                        : t('buyer.account.notifications.interests_selected', '{{count}} of {{total}} categories', { count: selected.length, total: availableCategories.length })}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t('buyer.account.notifications.interests_search', 'Search categories...')} />
                                    <CommandEmpty>{t('buyer.account.notifications.interests_empty', 'No categories found')}</CommandEmpty>
                                    <CommandGroup className="max-h-48 overflow-y-auto">
                                        {availableCategories.map((category) => {
                                            const isSelected = isSubscribedToAll || selected.includes(category);
                                            return (
                                                <CommandItem
                                                    key={category}
                                                    value={category}
                                                    onSelect={() => handleToggleCategory(category)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>
                                                    {category}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected category badges (only shown when filtered, not when "all") */}
                        {!isSubscribedToAll && selected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selected.map((category) => (
                                    <Badge key={category} variant="secondary" className="gap-1 pr-1">
                                        {category}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCategory(category)}
                                            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleResetToAll}
                                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                >
                                    {t('buyer.account.notifications.reset_all', 'Reset to all')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
