import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Plus, Trash2, Loader2, CheckCircle2, XCircle, Search, Zap, DollarSign, Package, Info, type LucideIcon } from 'lucide-react';
import { adminApi, type ConfigEntry } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

// Helpers
const isBooleanValue = (value: string) => ['true', 'false'].includes(value.toLowerCase());

function humanizeKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

const CRON_PRESETS = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every 12 hours', value: '0 */12 * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Custom', value: '__custom__' },
];

function isValidCron(expr: string): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    const field = /^(\*|(\*\/[1-9][0-9]*)|([0-9]+(,[0-9]+)*(-[0-9]+)?))$/;
    return parts.every(p => field.test(p));
}

const SUPPORTED_CURRENCIES: { code: string; label: string }[] = [
    { code: 'USD', label: 'USD - US Dollar' },
    { code: 'GBP', label: 'GBP - British Pound' },
    { code: 'EUR', label: 'EUR - Euro' },
    { code: 'INR', label: 'INR - Indian Rupee' },
    { code: 'JPY', label: 'JPY - Japanese Yen' },
    { code: 'AUD', label: 'AUD - Australian Dollar' },
    { code: 'CAD', label: 'CAD - Canadian Dollar' },
    { code: 'BRL', label: 'BRL - Brazilian Real' },
    { code: 'MXN', label: 'MXN - Mexican Peso' },
    { code: 'SGD', label: 'SGD - Singapore Dollar' },
    { code: 'AED', label: 'AED - UAE Dirham' },
    { code: 'SAR', label: 'SAR - Saudi Riyal' },
    { code: 'PLN', label: 'PLN - Polish Zloty' },
    { code: 'SEK', label: 'SEK - Swedish Krona' },
];

// Config categories
interface ConfigCategory {
    id: string;
    label: string;
    icon: LucideIcon;
    description: string;
    keys: string[];
}

const CONFIG_CATEGORIES: ConfigCategory[] = [
    {
        id: 'automation',
        label: 'Automation',
        icon: Zap,
        description: 'Automatic verification and payout schedules',
        keys: [
            'auto_order_verification_enabled',
            'auto_review_verification_enabled',
            'auto_payout_enabled',
            'auto_payout_cron_schedule',
        ],
    },
    {
        id: 'financial',
        label: 'Financial',
        icon: DollarSign,
        description: 'Fees, reimbursement delays, and payout limits',
        keys: [
            'platform_fee_percent',
            'reimbursement_delay_days',
            'auto_payout_max_amount',
        ],
    },
];

function categorizeConfigs(configs: ConfigEntry[]) {
    const categorized = CONFIG_CATEGORIES.map(cat => ({
        ...cat,
        configs: configs.filter(c => cat.keys.includes(c.key)),
    }));

    const knownKeys = new Set(CONFIG_CATEGORIES.flatMap(c => c.keys));
    const other = configs.filter(c => !knownKeys.has(c.key));

    if (other.length > 0) {
        categorized.push({
            id: 'other',
            label: 'Other',
            icon: Package,
            description: 'Additional configuration entries',
            keys: other.map(c => c.key),
            configs: other,
        });
    }

    return categorized.filter(c => c.configs.length > 0);
}

// Cron Input
function CronInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const matchedPreset = CRON_PRESETS.find(p => p.value === value && p.value !== '__custom__');
    const [preset, setPreset] = useState<string>(matchedPreset ? value : '__custom__');
    const [custom, setCustom] = useState(value);
    const valid = isValidCron(value);

    const handlePresetChange = (p: string) => {
        setPreset(p);
        if (p !== '__custom__') {
            setCustom(p);
            onChange(p);
        }
    };

    const handleCustomChange = (v: string) => {
        setCustom(v);
        onChange(v);
    };

    return (
        <div className="space-y-2">
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose a preset..." />
                </SelectTrigger>
                <SelectContent>
                    {CRON_PRESETS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {preset === '__custom__' && (
                <div className="relative">
                    <Input
                        value={custom}
                        onChange={e => handleCustomChange(e.target.value)}
                        placeholder="e.g. 0 */6 * * *"
                        className={`h-9 pr-8 font-mono text-sm ${!valid && custom ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {custom && (valid
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-destructive" />
                        )}
                    </div>
                </div>
            )}
            {!valid && value && (
                <p className="text-xs text-destructive">Invalid cron expression. Must have 5 space-separated fields.</p>
            )}
        </div>
    );
}

// Currency Amount Editor
function CurrencyAmountEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const parsed: Record<string, number> = (() => {
        try { return JSON.parse(value); } catch { return {}; }
    })();

    const [amounts, setAmounts] = useState<Record<string, string>>(
        Object.fromEntries(SUPPORTED_CURRENCIES.map(c => [c.code, parsed[c.code] !== undefined ? String(parsed[c.code]) : '']))
    );

    const handleChange = (code: string, raw: string) => {
        const next = { ...amounts, [code]: raw };
        setAmounts(next);
        const json = Object.fromEntries(
            Object.entries(next)
                .filter(([, v]) => v !== '' && !isNaN(Number(v)))
                .map(([k, v]) => [k, Number(v)])
        );
        onChange(JSON.stringify(json));
    };

    const activeCount = Object.values(amounts).filter(v => v !== '' && !isNaN(Number(v))).length;

    return (
        <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Leave blank for no limit.</p>
                <span className="text-xs text-muted-foreground">
                    {activeCount} of {SUPPORTED_CURRENCIES.length} set
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                    <div key={code} className="flex items-center gap-2">
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-xs font-mono font-semibold w-9 shrink-0 text-foreground cursor-default">{code}</span>
                                </TooltipTrigger>
                                <TooltipContent side="left"><p>{label}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="—"
                            value={amounts[code]}
                            onChange={e => handleChange(code, e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Action buttons
function SaveButton({ saving, disabled, onClick }: { saving: boolean; disabled: boolean; onClick: () => void }) {
    return (
        <Button size="sm" className="h-8" onClick={onClick} disabled={disabled}>
            {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
            Save
        </Button>
    );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
    return (
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onClick}>
            <Trash2 className="w-3.5 h-3.5" />
        </Button>
    );
}

// Config Row
interface ConfigRowProps {
    config: ConfigEntry;
    editedValues: Record<string, string>;
    savingKey: string | null;
    onEdit: (key: string, value: string) => void;
    onSave: (key: string) => void;
    onDelete: (key: string) => void;
    onToggle: (key: string, value: string) => void;
}

function ConfigRow({ config, editedValues, savingKey, onEdit, onSave, onDelete, onToggle }: ConfigRowProps) {
    const isEdited = editedValues[config.key] !== undefined;
    const currentValue = isEdited ? editedValues[config.key] : config.value;
    const isBoolean = isBooleanValue(config.value);
    const isCron = config.key === 'auto_payout_cron_schedule';
    const isCurrencyMap = config.key === 'auto_payout_max_amount';
    const isSaving = savingKey === config.key;

    // Boolean: single row with label left, switch right
    if (isBoolean) {
        return (
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{humanizeKey(config.key)}</h4>
                    {config.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    <span className={`text-sm font-medium w-16 text-right ${currentValue.toLowerCase() === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {currentValue.toLowerCase() === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                        checked={currentValue.toLowerCase() === 'true'}
                        onCheckedChange={(checked) => onToggle(config.key, String(checked))}
                        disabled={isSaving}
                    />
                    <DeleteButton onClick={() => onDelete(config.key)} />
                </div>
            </div>
        );
    }

    // Cron: same row layout as text inputs — label left, dropdown + buttons right
    if (isCron) {
        return (
            <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0 shrink-0 w-2/5">
                    <h4 className="text-sm font-medium text-foreground">{humanizeKey(config.key)}</h4>
                    {config.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="w-full max-w-[280px]">
                        <CronInput value={currentValue} onChange={v => onEdit(config.key, v)} />
                    </div>
                    <SaveButton saving={isSaving} disabled={!isEdited || isSaving || !isValidCron(currentValue)} onClick={() => onSave(config.key)} />
                    <DeleteButton onClick={() => onDelete(config.key)} />
                </div>
            </div>
        );
    }

    // Currency map: label top-left, expanded editor below (needs full width)
    if (isCurrencyMap) {
        return (
            <div className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                        <h4 className="text-sm font-medium text-foreground">{humanizeKey(config.key)}</h4>
                        {config.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <SaveButton saving={isSaving} disabled={!isEdited || isSaving} onClick={() => onSave(config.key)} />
                        <DeleteButton onClick={() => onDelete(config.key)} />
                    </div>
                </div>
                <CurrencyAmountEditor value={currentValue} onChange={v => onEdit(config.key, v)} />
            </div>
        );
    }

    // Default: label left, input + buttons right
    return (
        <div className="flex items-center justify-between gap-6 py-4">
            <div className="min-w-0 shrink-0 w-2/5">
                <h4 className="text-sm font-medium text-foreground">{humanizeKey(config.key)}</h4>
                {config.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
                <Input
                    value={currentValue}
                    onChange={(e) => onEdit(config.key, e.target.value)}
                    className="h-9 max-w-[280px]"
                />
                <SaveButton saving={isSaving} disabled={!isEdited || isSaving} onClick={() => onSave(config.key)} />
                <DeleteButton onClick={() => onDelete(config.key)} />
            </div>
        </div>
    );
}

// ─── Category Card ───────────────────────────────────────────────────────────

interface CategorySectionProps {
    category: ConfigCategory & { configs: ConfigEntry[] };
    editedValues: Record<string, string>;
    savingKey: string | null;
    onEdit: (key: string, value: string) => void;
    onSave: (key: string) => void;
    onDelete: (key: string) => void;
    onToggle: (key: string, value: string) => void;
}

function CategorySection({ category, editedValues, savingKey, onEdit, onSave, onDelete, onToggle }: CategorySectionProps) {
    const Icon = category.icon;

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-0">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-sm">{category.label}</CardTitle>
                        <CardDescription className="text-xs">{category.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="divide-y">
                    {category.configs.map(config => (
                        <ConfigRow
                            key={config.key}
                            config={config}
                            editedValues={editedValues}
                            savingKey={savingKey}
                            onEdit={onEdit}
                            onSave={onSave}
                            onDelete={onDelete}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Main Component
export function SystemConfigEditor() {
    const [configs, setConfigs] = useState<ConfigEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Add dialog state
    const [addDialog, setAddDialog] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newIsBoolean, setNewIsBoolean] = useState(false);

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; key: string }>({ open: false, key: '' });

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getConfigs();
            setConfigs(data);
            setEditedValues({});
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const filteredConfigs = useMemo(() => {
        if (!searchQuery.trim()) return configs;
        const q = searchQuery.toLowerCase();
        return configs.filter(c =>
            c.key.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q) ||
            c.value.toLowerCase().includes(q)
        );
    }, [configs, searchQuery]);

    const categories = useMemo(() => categorizeConfigs(filteredConfigs), [filteredConfigs]);

    const handleEdit = (key: string, value: string) => {
        setEditedValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string) => {
        const value = editedValues[key];
        if (value === undefined) return;
        setSavingKey(key);
        try {
            await adminApi.updateConfig(key, value);
            toast.success(`Config "${key}" updated`);
            fetchConfigs();
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setSavingKey(null);
        }
    };

    const handleToggle = async (key: string, value: string) => {
        setEditedValues(prev => ({ ...prev, [key]: value }));
        setSavingKey(key);
        try {
            await adminApi.updateConfig(key, value);
            toast.success(`Config "${key}" updated`);
            fetchConfigs();
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setSavingKey(null);
        }
    };

    const handleCreate = async () => {
        if (!newKey.trim() || !newValue.trim()) {
            toast.error('Key and value are required');
            return;
        }
        try {
            await adminApi.createConfig(newKey, newValue, newDescription || undefined);
            toast.success('Config created');
            setAddDialog(false);
            setNewKey('');
            setNewValue('');
            setNewDescription('');
            setNewIsBoolean(false);
            fetchConfigs();
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        }
    };

    const handleDelete = async () => {
        try {
            await adminApi.deleteConfig(deleteDialog.key);
            toast.success('Config deleted');
            setDeleteDialog({ open: false, key: '' });
            fetchConfigs();
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">Platform Configuration</h2>
                    <p className="text-sm text-muted-foreground">Manage platform-wide settings and parameters.</p>
                </div>
                <div className="flex items-center gap-2">
                    {configs.length > 0 && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search configs..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-9 w-[200px] pl-8 text-sm"
                            />
                        </div>
                    )}
                    <Button size="sm" onClick={() => setAddDialog(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Config
                    </Button>
                </div>
            </div>

            {/* Content */}
            {configs.length === 0 ? (
                <Card className="border shadow-sm">
                    <CardContent className="py-16">
                        <div className="text-center text-muted-foreground">
                            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Info className="w-6 h-6 opacity-50" />
                            </div>
                            <p className="font-medium">No configuration entries</p>
                            <p className="text-sm mt-1">Add your first config to get started.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : filteredConfigs.length === 0 ? (
                <Card className="border shadow-sm">
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No configs match &ldquo;{searchQuery}&rdquo;</p>
                            <p className="text-sm mt-1">Try a different search term.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-5">
                    {categories.map(category => (
                        <CategorySection
                            key={category.id}
                            category={category}
                            editedValues={editedValues}
                            savingKey={savingKey}
                            onEdit={handleEdit}
                            onSave={handleSave}
                            onDelete={(key) => setDeleteDialog({ open: true, key })}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {/* Add Config Dialog */}
            <Dialog open={addDialog} onOpenChange={setAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Key</Label>
                            <Input
                                placeholder="config_key_name"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                            <Switch
                                checked={newIsBoolean}
                                onCheckedChange={(checked) => {
                                    setNewIsBoolean(checked);
                                    if (checked) setNewValue('true');
                                    else setNewValue('');
                                }}
                            />
                            <div>
                                <Label className="cursor-pointer">Boolean value</Label>
                                <p className="text-xs text-muted-foreground">Toggle on for true/false config values</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Value</Label>
                            {newIsBoolean ? (
                                <div className="flex items-center gap-3 py-1">
                                    <Switch
                                        checked={newValue === 'true'}
                                        onCheckedChange={(checked) => setNewValue(String(checked))}
                                    />
                                    <span className={`text-sm font-medium ${newValue === 'true' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {newValue === 'true' ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ) : (
                                <Input
                                    placeholder="value"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Description <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                placeholder="What this config does..."
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newKey.trim() || !newValue.trim()}>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, key: '' }); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete configuration</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-mono font-medium text-foreground">&ldquo;{deleteDialog.key}&rdquo;</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
