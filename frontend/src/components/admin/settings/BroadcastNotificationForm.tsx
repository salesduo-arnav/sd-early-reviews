import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Send, Bell, Loader2, Users, ShoppingCart, Store, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

// Constants

const TARGET_OPTIONS = [
    { value: 'ALL', label: 'All Users', icon: Users, description: 'Every user on the platform' },
    { value: 'BUYERS', label: 'All Buyers', icon: ShoppingCart, description: 'Users with buyer accounts' },
    { value: 'SELLERS', label: 'All Sellers', icon: Store, description: 'Users with seller accounts' },
] as const;

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'Low', color: 'bg-slate-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-500' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-500' },
] as const;

// Main Component
export function BroadcastNotificationForm() {
    const [target, setTarget] = useState('ALL');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [actionLink, setActionLink] = useState('');
    const [sending, setSending] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);

    const targetOption = TARGET_OPTIONS.find(t => t.value === target);
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
    const isValid = title.trim().length > 0 && message.trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) {
            toast.error('Title and message are required');
            return;
        }
        setConfirmDialog(true);
    };

    const handleConfirmedSend = async () => {
        setConfirmDialog(false);
        setSending(true);
        try {
            const result = await adminApi.broadcastNotification(target, title, message, priority, actionLink || undefined);
            toast.success(result.message || 'Notification sent');
            setTitle('');
            setMessage('');
            setActionLink('');
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                            Broadcast Notification
                        </CardTitle>
                        <CardDescription>Send a notification to all users or a specific audience group.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Target & Priority Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Target Audience</Label>
                                    <Select value={target} onValueChange={setTarget}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TARGET_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        <opt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {targetOption && (
                                        <p className="text-xs text-muted-foreground">{targetOption.description}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITY_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {priority === 'CRITICAL' && (
                                        <p className="text-xs text-orange-600 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Will trigger prominent alerts for users
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input
                                    placeholder="Notification title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-9"
                                    maxLength={200}
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label>Message</Label>
                                    <span className="text-xs text-muted-foreground">{message.length} / 1000</span>
                                </div>
                                <Textarea
                                    placeholder="Write your notification message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            {/* Action Link */}
                            <div className="space-y-1.5">
                                <Label>
                                    Action Link <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    placeholder="/buyer/marketplace"
                                    value={actionLink}
                                    onChange={(e) => setActionLink(e.target.value)}
                                    className="h-9"
                                />
                                <p className="text-xs text-muted-foreground">Users will be redirected to this path when they click the notification.</p>
                            </div>

                            {/* Submit */}
                            <Button type="submit" disabled={sending || !isValid} className="w-full sm:w-auto">
                                {sending
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                    : <><Send className="w-4 h-4 mr-2" /> Send Notification</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card className="border shadow-sm h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Preview</CardTitle>
                        <CardDescription className="text-xs">How the notification will appear to users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Bell className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-sm font-medium leading-snug">
                                        {title || <span className="text-muted-foreground italic">Notification title</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                        {message || <span className="italic">Message body will appear here...</span>}
                                    </p>
                                </div>
                            </div>
                            {actionLink && (
                                <div className="text-xs text-primary truncate pl-11">
                                    {actionLink}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Audience</span>
                                <Badge variant="secondary" className="text-xs font-normal">
                                    {targetOption?.label}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Priority</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${priorityOption?.color}`} />
                                    <span className="text-xs font-medium">{priorityOption?.label}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send broadcast notification?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You are about to send a <span className="font-medium text-foreground">{priorityOption?.label}</span> priority notification to <span className="font-medium text-foreground">{targetOption?.label}</span>.
                                </p>
                                <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                                    <p className="text-sm font-medium text-foreground">{title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{message}</p>
                                </div>
                                <p>This action cannot be undone.</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmedSend}>
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
