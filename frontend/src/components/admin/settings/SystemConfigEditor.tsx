import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2, Loader2, Settings } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toast } from 'sonner';
import { format } from 'date-fns';

const isBooleanValue = (value: string) =>
    ['true', 'false'].includes(value.toLowerCase());

interface ConfigEntry {
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

export function SystemConfigEditor() {
    const [configs, setConfigs] = useState<ConfigEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [addDialog, setAddDialog] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newIsBoolean, setNewIsBoolean] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; key: string }>({ open: false, key: '' });

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getConfigs();
            setConfigs(data);
            setEditedValues({});
        } catch (err) { console.error('Failed to fetch data:', err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const handleSave = async (key: string) => {
        const value = editedValues[key];
        if (value === undefined) return;
        setSavingKey(key);
        try {
            await adminApi.updateConfig(key, value);
            toast.success(`Config "${key}" updated`);
            fetchConfigs();
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'An error occurred'); }
        finally { setSavingKey(null); }
    };

    const handleCreate = async () => {
        if (!newKey.trim() || !newValue.trim()) { toast.error('Key and value are required'); return; }
        try {
            await adminApi.createConfig(newKey, newValue, newDescription || undefined);
            toast.success('Config created');
            setAddDialog(false);
            setNewKey('');
            setNewValue('');
            setNewDescription('');
            setNewIsBoolean(false);
            fetchConfigs();
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'An error occurred'); }
    };

    const handleDelete = async () => {
        try {
            await adminApi.deleteConfig(deleteDialog.key);
            toast.success('Config deleted');
            setDeleteDialog({ open: false, key: '' });
            fetchConfigs();
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'An error occurred'); }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <Card className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            Platform Configuration
                        </CardTitle>
                        <CardDescription>Manage platform-wide settings and parameters.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setAddDialog(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Config
                    </Button>
                </CardHeader>
                <CardContent>
                    {configs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No configuration entries</p>
                            <p className="text-sm mt-1">Add your first config to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {configs.map((config) => {
                                const isEdited = editedValues[config.key] !== undefined;
                                const currentValue = isEdited ? editedValues[config.key] : config.value;
                                const isBoolean = isBooleanValue(config.value);

                                return (
                                    <div key={config.key} className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:border-border/80 transition-colors">
                                        <div className="flex-1 space-y-2.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">{config.key}</Badge>
                                                {config.description && <span className="text-xs text-muted-foreground">{config.description}</span>}
                                            </div>
                                            {isBoolean ? (
                                                <div className="flex items-center gap-3 py-1">
                                                    <Switch
                                                        checked={currentValue.toLowerCase() === 'true'}
                                                        onCheckedChange={(checked) => {
                                                            const newVal = String(checked);
                                                            setEditedValues(prev => ({ ...prev, [config.key]: newVal }));
                                                            // Auto-save boolean toggles
                                                            setSavingKey(config.key);
                                                            adminApi.updateConfig(config.key, newVal)
                                                                .then(() => { toast.success(`Config "${config.key}" updated`); fetchConfigs(); })
                                                                .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'An error occurred'))
                                                                .finally(() => setSavingKey(null));
                                                        }}
                                                        disabled={savingKey === config.key}
                                                    />
                                                    <span className={`text-sm font-medium ${currentValue.toLowerCase() === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                        {currentValue.toLowerCase() === 'true' ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                    {savingKey === config.key && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                                                </div>
                                            ) : (
                                                <Input
                                                    value={currentValue}
                                                    onChange={(e) => setEditedValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                                                    className="h-9"
                                                />
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Updated {format(new Date(config.updated_at), 'MMM d, yyyy \'at\' HH:mm')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 pt-7">
                                            {!isBoolean && (
                                                <Button
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => handleSave(config.key)}
                                                    disabled={!isEdited || savingKey === config.key}
                                                >
                                                    {savingKey === config.key
                                                        ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                        : <Save className="w-3 h-3 mr-1" />}
                                                    Save
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog({ open: true, key: config.key })}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={addDialog} onOpenChange={setAddDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Configuration</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Key</Label>
                            <Input placeholder="config_key_name" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={newIsBoolean} onCheckedChange={(checked) => { setNewIsBoolean(checked); if (checked) setNewValue('true'); else setNewValue(''); }} />
                            <Label className="cursor-pointer">Boolean value</Label>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Value</Label>
                            {newIsBoolean ? (
                                <div className="flex items-center gap-3 py-1">
                                    <Switch checked={newValue === 'true'} onCheckedChange={(checked) => setNewValue(String(checked))} />
                                    <span className={`text-sm font-medium ${newValue === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {newValue === 'true' ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ) : (
                                <Input placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description (optional)</Label>
                            <Textarea placeholder="What this config does..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, key: '' }); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete config "{deleteDialog.key}"?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
