import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bell, Loader2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export function BroadcastNotificationForm() {
    const [target, setTarget] = useState('ALL');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [actionLink, setActionLink] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }
        setSending(true);
        try {
            const result = await adminApi.broadcastNotification(target, title, message, priority, actionLink || undefined);
            toast.success(result.message || 'Notification sent');
            setTitle('');
            setMessage('');
            setActionLink('');
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setSending(false); }
    };

    return (
        <Card className="max-w-2xl border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    Broadcast Notification
                </CardTitle>
                <CardDescription>Send a notification to all users or a specific audience group.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Target Audience</Label>
                            <Select value={target} onValueChange={setTarget}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Users</SelectItem>
                                    <SelectItem value="BUYERS">All Buyers</SelectItem>
                                    <SelectItem value="SELLERS">All Sellers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Message</Label>
                        <Textarea placeholder="Notification message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Action Link <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input placeholder="/buyer/marketplace" value={actionLink} onChange={(e) => setActionLink(e.target.value)} className="h-9" />
                    </div>

                    <Button type="submit" disabled={sending} className="w-full">
                        {sending
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            : <><Send className="w-4 h-4 mr-2" /> Send Notification</>}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
