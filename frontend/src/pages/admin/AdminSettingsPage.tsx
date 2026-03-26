import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemConfigEditor } from '@/components/admin/settings/SystemConfigEditor';
import { AuditLogsTable } from '@/components/admin/settings/AuditLogsTable';
import { BroadcastNotificationForm } from '@/components/admin/settings/BroadcastNotificationForm';
import { Settings, ScrollText, Bell } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('config');

    return (
        <div className="space-y-6">
            <PageMeta title="Admin Settings" description="Configure system settings, view audit logs, and send broadcast notifications on SalesDuo Early Reviews." />
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-500/10 text-gray-600">
                    <Settings className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground text-sm">Platform configuration, audit logs, and notifications.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="config" className="gap-1.5">
                        <Settings className="h-3.5 w-3.5" />
                        System Config
                    </TabsTrigger>
                    <TabsTrigger value="audit-logs" className="gap-1.5">
                        <ScrollText className="h-3.5 w-3.5" />
                        Audit Logs
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-1.5">
                        <Bell className="h-3.5 w-3.5" />
                        Notifications
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="config" className="mt-6">
                    <SystemConfigEditor />
                </TabsContent>
                <TabsContent value="audit-logs" className="mt-6">
                    <AuditLogsTable />
                </TabsContent>
                <TabsContent value="notifications" className="mt-6">
                    <BroadcastNotificationForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
