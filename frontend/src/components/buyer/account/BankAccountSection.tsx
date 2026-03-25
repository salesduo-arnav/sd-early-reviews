import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Landmark, Pencil, Trash2, Plus, Loader2, Shield, CheckCircle2, Globe, CreditCard } from 'lucide-react';
import { buyerApi } from '@/api/buyer';
import type { WiseAccountRequirement, ConnectBankPayload } from '@/api/buyer';
import { WiseFormRenderer } from '@/components/ui/wise-form-renderer';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { getCountryOptions } from '@/lib/regions';

const COUNTRY_OPTIONS = getCountryOptions();

const HIDDEN_KEYS = new Set(['type']);

interface BankAccountSectionProps {
    wiseConnected: boolean;
    payoutCurrency: string | null;
    payoutCountry: string | null;
    bankDisplayLabel: string | null;
    loading: boolean;
    onConnected: () => void;
    onDisconnected: () => void;
}

export default function BankAccountSection({
    wiseConnected, payoutCurrency, payoutCountry, bankDisplayLabel,
    loading, onConnected, onDisconnected,
}: BankAccountSectionProps) {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [removing, setRemoving] = useState(false);

    const [selectedCountry, setSelectedCountry] = useState('');
    const [requirements, setRequirements] = useState<WiseAccountRequirement[]>([]);
    const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
    const [loadingRequirements, setLoadingRequirements] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const selectedCountryObj = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);
    const activeRequirement = requirements[selectedTypeIndex] || null;

    // Auto-prefill country fields from the selected country
    const prefillCountry = (req: WiseAccountRequirement, countryCode: string) => {
        const prefill: Record<string, string> = {};
        for (const field of req.fields) {
            for (const g of field.group) {
                if (g.key.toLowerCase().includes('country') && g.type === 'select' && g.valuesAllowed) {
                    const match = g.valuesAllowed.find(v => v.key === countryCode);
                    if (match) prefill[g.key] = match.key;
                }
            }
        }
        return prefill;
    };

    useEffect(() => {
        if (!selectedCountry || !selectedCountryObj) return;
        setLoadingRequirements(true);
        setRequirements([]);
        setSelectedTypeIndex(0);
        setFormValues({});
        buyerApi.getBankRequirements(selectedCountryObj.currency)
            .then(reqs => {
                if (Array.isArray(reqs) && reqs.length > 0) {
                    setRequirements(reqs);
                    setFormValues(prefillCountry(reqs[0], selectedCountryObj.code));
                } else {
                    toast.error('No bank account options available for this country');
                }
            })
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoadingRequirements(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedCountryObj is derived from selectedCountry; listing both would be redundant
    }, [selectedCountry]);

    const handleTypeChange = (index: number) => {
        setSelectedTypeIndex(index);
        setFormValues(selectedCountryObj && requirements[index]
            ? prefillCountry(requirements[index], selectedCountryObj.code)
            : {});
    };

    const handleFieldChange = useCallback((key: string, value: string) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleRefreshRequirements = useCallback(async () => {
        if (!selectedCountryObj || !activeRequirement) return;

        // Build the body Wise expects: { type, ...flatValues }
        const body: Record<string, unknown> = { type: activeRequirement.type };
        for (const [key, value] of Object.entries(formValues)) {
            if (value) body[key] = value;
        }

        try {
            const reqs = await buyerApi.refreshBankRequirements(selectedCountryObj.currency, body);
            if (Array.isArray(reqs) && reqs.length > 0) {
                // Find the matching requirement type and update its fields
                const matchIdx = reqs.findIndex(r => r.type === activeRequirement.type);
                if (matchIdx >= 0) {
                    setRequirements(prev => {
                        const updated = [...prev];
                        updated[selectedTypeIndex] = reqs[matchIdx];
                        return updated;
                    });
                }
            }
        } catch {
            // Silent fail — fields just won't update
        }
    }, [selectedCountryObj, activeRequirement, formValues, selectedTypeIndex]);

    const handleSubmit = async () => {
        if (!selectedCountryObj || !activeRequirement) return;

        const details: Record<string, string> = {};
        for (const [key, value] of Object.entries(formValues)) {
            if (key.startsWith('details.')) {
                details[key.replace('details.', '')] = value;
            } else if (key !== 'type' && key !== 'accountHolderName') {
                details[key] = value;
            }
        }

        const payload: ConnectBankPayload = {
            currency: selectedCountryObj.currency,
            country: selectedCountryObj.code,
            type: activeRequirement.type,
            details,
        };

        setSubmitting(true);
        try {
            await buyerApi.connectBankAccount(payload);
            toast.success(t('buyer.account.bank.connected_success', 'Bank account connected successfully'));
            setDialogOpen(false);
            setSelectedCountry('');
            setRequirements([]);
            setFormValues({});
            onConnected();
            window.dispatchEvent(new Event('bank-account-changed'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDisconnect = async () => {
        setRemoving(true);
        try {
            await buyerApi.disconnectBankAccount();
            toast.success(t('buyer.account.bank.disconnected_success', 'Bank account disconnected'));
            onDisconnected();
            window.dispatchEvent(new Event('bank-account-changed'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setRemoving(false);
        }
    };

    const handleOpenDialog = () => {
        setSelectedCountry('');
        setRequirements([]);
        setFormValues({});
        setDialogOpen(true);
    };

    const countryLabel = COUNTRY_OPTIONS.find(c => c.code === payoutCountry)?.label
        || (payoutCountry && payoutCurrency ? `${payoutCountry} (${payoutCurrency})` : '');

    return (
        <>
            {/* Connected / Empty state card */}
            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${wiseConnected ? 'bg-green-50' : 'bg-muted'}`}>
                            <Landmark className={`h-4 w-4 ${wiseConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                                {t('buyer.account.bank.title', 'Bank Account')}
                            </CardTitle>
                            {!loading && wiseConnected && (
                                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50" variant="outline">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t('buyer.account.bank.connected_badge', 'Connected')}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {!loading && wiseConnected && (
                        <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" onClick={handleOpenDialog} className="text-muted-foreground hover:text-foreground">
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                {t('buyer.account.bank.edit', 'Edit')}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        {t('buyer.account.bank.disconnect', 'Remove')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('buyer.account.bank.disconnect_title', 'Disconnect Bank Account?')}</AlertDialogTitle>
                                        <AlertDialogDescription>{t('buyer.account.bank.disconnect_description', 'This will remove your bank account. You will not be able to receive reimbursements until you connect a new one.')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDisconnect} disabled={removing}>
                                            {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                            {t('buyer.account.bank.disconnect_confirm', 'Disconnect')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    ) : wiseConnected ? (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Globe className="h-3.5 w-3.5" />
                                        {t('buyer.account.bank.country', 'Country')}
                                    </div>
                                    <span className="text-sm font-medium">{countryLabel}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        {t('buyer.account.bank.account_info', 'Account')}
                                    </div>
                                    <span className="text-sm font-medium font-mono">{bankDisplayLabel}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Landmark className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-medium mb-1">
                                {t('buyer.account.bank.empty_heading', 'No bank account connected')}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                                {t('buyer.account.bank.empty_title', 'Add your bank account to start receiving reimbursements for your reviews.')}
                            </p>
                            <Button onClick={handleOpenDialog} size="sm">
                                <Plus className="h-4 w-4 mr-1.5" />
                                {t('buyer.account.bank.add', 'Add Bank Account')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Dialog header */}
                    <div className="p-6 pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-brand-primary/10">
                                    <Landmark className="h-4 w-4 text-brand-primary" />
                                </div>
                                {wiseConnected
                                    ? t('buyer.account.bank.dialog_edit_title', 'Update Bank Details')
                                    : t('buyer.account.bank.dialog_add_title', 'Add Bank Details')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('buyer.account.bank.dialog_description', 'Select your country and enter your bank details to receive reimbursements.')}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <Separator />

                    {/* Scrollable form body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className="space-y-5">
                            {/* Step 1: Country selector */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    {t('buyer.account.bank.select_country', 'Country')}
                                </Label>
                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                    <SelectTrigger className="h-10">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder="Select your country" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {COUNTRY_OPTIONS.map(c => (
                                            <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Loading skeleton */}
                            {loadingRequirements && (
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            )}

                            {/* Transfer method tabs */}
                            {!loadingRequirements && requirements.length > 1 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{t('buyer.account.bank.transfer_method', 'Transfer method')}</Label>
                                    <div className="flex items-center rounded-lg bg-muted p-1 gap-1">
                                        {requirements.map((req, idx) => (
                                            <button
                                                key={req.type}
                                                type="button"
                                                onClick={() => handleTypeChange(idx)}
                                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                                                    selectedTypeIndex === idx
                                                        ? 'bg-background text-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {req.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dynamic form fields */}
                            {!loadingRequirements && activeRequirement && (
                                <>
                                    {selectedCountry && <Separator />}
                                    <WiseFormRenderer
                                        fields={activeRequirement.fields}
                                        values={formValues}
                                        onChange={handleFieldChange}
                                        hiddenKeys={HIDDEN_KEYS}
                                        onRefreshNeeded={handleRefreshRequirements}
                                    />
                                </>
                            )}

                            {/* No requirements fallback */}
                            {!loadingRequirements && selectedCountry && requirements.length === 0 && (
                                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        {t('buyer.account.bank.no_requirements', 'Unable to load bank requirements for this country. Please try again.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Dialog footer */}
                    <div className="p-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Shield className="h-3.5 w-3.5" />
                                <span>{t('buyer.account.bank.secured_by_wise', 'Secured by Wise')}</span>
                            </div>
                            <DialogFooter className="flex-row gap-2 sm:space-x-0">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting || !selectedCountry || !activeRequirement}>
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                                    {wiseConnected ? t('buyer.account.bank.update_account', 'Update Account') : t('buyer.account.bank.connect_account', 'Connect Account')}
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
