import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Landmark, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { buyerApi } from '@/api/buyer';
import type { WiseAccountRequirement, ConnectBankPayload } from '@/api/buyer';
import { WiseFormRenderer } from '@/components/ui/wise-form-renderer';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const COUNTRY_OPTIONS = [
    { code: 'IN', currency: 'INR', label: 'India (INR)' },
    { code: 'US', currency: 'USD', label: 'United States (USD)' },
    { code: 'GB', currency: 'GBP', label: 'United Kingdom (GBP)' },
    { code: 'DE', currency: 'EUR', label: 'Germany (EUR)' },
    { code: 'FR', currency: 'EUR', label: 'France (EUR)' },
    { code: 'AE', currency: 'AED', label: 'UAE (AED)' },
    { code: 'AU', currency: 'AUD', label: 'Australia (AUD)' },
    { code: 'NZ', currency: 'NZD', label: 'New Zealand (NZD)' },
    { code: 'CA', currency: 'CAD', label: 'Canada (CAD)' },
    { code: 'JP', currency: 'JPY', label: 'Japan (JPY)' },
    { code: 'SG', currency: 'SGD', label: 'Singapore (SGD)' },
    { code: 'ES', currency: 'EUR', label: 'Spain (EUR)' },
    { code: 'IT', currency: 'EUR', label: 'Italy (EUR)' },
    { code: 'NL', currency: 'EUR', label: 'Netherlands (EUR)' },
    { code: 'SE', currency: 'SEK', label: 'Sweden (SEK)' },
    { code: 'PL', currency: 'PLN', label: 'Poland (PLN)' },
    { code: 'BR', currency: 'BRL', label: 'Brazil (BRL)' },
    { code: 'MX', currency: 'MXN', label: 'Mexico (MXN)' },
];

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
                        <div className="p-2 rounded-lg bg-green-50">
                            <Landmark className="h-4 w-4 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">
                            {t('buyer.account.bank.title', 'Bank Account')}
                        </CardTitle>
                    </div>
                    {!loading && wiseConnected && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                                <Pencil className="h-4 w-4 mr-1" />
                                {t('buyer.account.bank.edit', 'Edit')}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {t('buyer.account.bank.disconnect', 'Disconnect')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('buyer.account.bank.disconnect_title', 'Disconnect Bank Account?')}</AlertDialogTitle>
                                        <AlertDialogDescription>{t('buyer.account.bank.disconnect_description', 'This will remove your bank account. You will not be able to receive reimbursements until you connect a new one.')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDisconnect} disabled={removing}>
                                            {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                            Disconnect
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
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('buyer.account.bank.country', 'Country')}</span>
                                <span className="font-medium">{countryLabel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('buyer.account.bank.account_info', 'Account')}</span>
                                <span className="font-medium">{bankDisplayLabel}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('buyer.account.bank.empty_title', 'No bank account connected. Add your bank account to receive reimbursements.')}
                            </p>
                            <Button onClick={handleOpenDialog}>
                                <Plus className="h-4 w-4 mr-1" />
                                {t('buyer.account.bank.add', 'Add Bank Account')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {wiseConnected
                                ? t('buyer.account.bank.dialog_edit_title', 'Update Bank Account')
                                : t('buyer.account.bank.dialog_add_title', 'Add Bank Account')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('buyer.account.bank.dialog_description', 'Select your country and enter your bank details. Your information is securely stored with our payment partner.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Country selector */}
                        <div className="space-y-2">
                            <Label>{t('buyer.account.bank.select_country', 'Country')}</Label>
                            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {COUNTRY_OPTIONS.map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Loading */}
                        {loadingRequirements && (
                            <div className="space-y-3 py-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        )}

                        {/* Account type tabs (ACH vs Wire, etc.) */}
                        {!loadingRequirements && requirements.length > 1 && (
                            <div className="space-y-2">
                                <Label>Transfer method</Label>
                                <div className="flex gap-2">
                                    {requirements.map((req, idx) => (
                                        <button
                                            key={req.type}
                                            type="button"
                                            onClick={() => handleTypeChange(idx)}
                                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                                selectedTypeIndex === idx
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                                            }`}
                                        >
                                            {req.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dynamic form via WiseFormRenderer */}
                        {!loadingRequirements && activeRequirement && (
                            <WiseFormRenderer
                                fields={activeRequirement.fields}
                                values={formValues}
                                onChange={handleFieldChange}
                                hiddenKeys={HIDDEN_KEYS}
                                onRefreshNeeded={handleRefreshRequirements}
                            />
                        )}

                        {/* No requirements */}
                        {!loadingRequirements && selectedCountry && requirements.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {t('buyer.account.bank.no_requirements', 'Unable to load bank requirements for this country. Please try again.')}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || !selectedCountry || !activeRequirement}>
                            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            {wiseConnected ? 'Update' : 'Connect'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
