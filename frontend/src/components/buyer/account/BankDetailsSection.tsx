import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Landmark, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import type { BankDetailsPayload } from '@/api/buyer';

interface BankDetails {
    account_holder: string | null;
    routing_number: string | null;
    account_last4: string | null;
}

interface BankDetailsSectionProps {
    bankDetails: BankDetails | undefined;
    loading: boolean;
    onUpdate: (payload: BankDetailsPayload) => Promise<void>;
    onRemove: () => Promise<void>;
}

export default function BankDetailsSection({ bankDetails, loading, onUpdate, onRemove }: BankDetailsSectionProps) {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [removing, setRemoving] = useState(false);

    const hasBankDetails = bankDetails?.account_holder && bankDetails?.account_last4;

    const bankSchema = z.object({
        account_holder: z.string()
            .min(2, t('buyer.account.bank.validation.name_min', 'Name must be at least 2 characters'))
            .max(100, t('buyer.account.bank.validation.name_max', 'Name must be at most 100 characters')),
        routing_number: z.string()
            .regex(/^\d{9}$/, t('buyer.account.bank.validation.routing_format', 'Routing number must be exactly 9 digits')),
        account_number: z.string()
            .regex(/^\d{8,17}$/, t('buyer.account.bank.validation.account_format', 'Account number must be 8-17 digits')),
        confirm_account_number: z.string(),
    }).refine((data) => data.account_number === data.confirm_account_number, {
        message: t('buyer.account.bank.validation.account_mismatch', 'Account numbers must match'),
        path: ['confirm_account_number'],
    });

    type BankFormValues = z.infer<typeof bankSchema>;

    const form = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: {
            account_holder: '',
            routing_number: '',
            account_number: '',
            confirm_account_number: '',
        },
    });

    const handleOpenDialog = () => {
        form.reset({
            account_holder: bankDetails?.account_holder ?? '',
            routing_number: bankDetails?.routing_number ?? '',
            account_number: '',
            confirm_account_number: '',
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (values: BankFormValues) => {
        setSubmitting(true);
        try {
            await onUpdate({
                account_holder: values.account_holder,
                routing_number: values.routing_number,
                account_number: values.account_number,
            });
            setDialogOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        try {
            await onRemove();
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-50">
                            <Landmark className="h-4 w-4 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">
                            {t('buyer.account.bank.title', 'Bank Details')}
                        </CardTitle>
                    </div>
                    {!loading && hasBankDetails && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                                <Pencil className="h-4 w-4 mr-1" />
                                {t('buyer.account.bank.edit', 'Edit')}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {t('buyer.account.bank.remove', 'Remove')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {t('buyer.account.bank.remove_title', 'Remove Bank Details?')}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('buyer.account.bank.remove_description', 'This will remove your saved bank information. You can add new details later.')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            {t('buyer.account.bank.cancel', 'Cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemove} disabled={removing}>
                                            {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                            {t('buyer.account.bank.remove', 'Remove')}
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
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ) : hasBankDetails ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('buyer.account.bank.account_holder', 'Account Holder')}
                                </span>
                                <span className="font-medium">{bankDetails.account_holder}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('buyer.account.bank.routing_number', 'Routing Number')}
                                </span>
                                <span className="font-medium">****{bankDetails.routing_number?.slice(-5)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('buyer.account.bank.account_number', 'Account Number')}
                                </span>
                                <span className="font-medium">****{bankDetails.account_last4}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('buyer.account.bank.empty_title', 'No bank details on file. Add your bank account to receive reimbursements.')}
                            </p>
                            <Button onClick={handleOpenDialog}>
                                <Plus className="h-4 w-4 mr-1" />
                                {t('buyer.account.bank.add', 'Add Bank Details')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {hasBankDetails
                                ? t('buyer.account.bank.dialog_edit_title', 'Edit Bank Details')
                                : t('buyer.account.bank.dialog_add_title', 'Add Bank Details')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('buyer.account.bank.dialog_description', 'Your full account number is never stored. Only the last 4 digits are saved for reference.')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="account_holder">
                                {t('buyer.account.bank.account_holder_name', 'Account Holder Name')}
                            </Label>
                            <Input
                                id="account_holder"
                                placeholder={t('buyer.account.bank.placeholder_name', 'John Doe')}
                                {...form.register('account_holder')}
                            />
                            {form.formState.errors.account_holder && (
                                <p className="text-xs text-destructive">{form.formState.errors.account_holder.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="routing_number">
                                {t('buyer.account.bank.routing_number', 'Routing Number')}
                            </Label>
                            <Input
                                id="routing_number"
                                placeholder={t('buyer.account.bank.placeholder_routing', '123456789')}
                                maxLength={9}
                                {...form.register('routing_number')}
                            />
                            {form.formState.errors.routing_number && (
                                <p className="text-xs text-destructive">{form.formState.errors.routing_number.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_number">
                                {t('buyer.account.bank.account_number', 'Account Number')}
                            </Label>
                            <Input
                                id="account_number"
                                type="password"
                                placeholder={t('buyer.account.bank.placeholder_account', 'Enter account number')}
                                {...form.register('account_number')}
                            />
                            {form.formState.errors.account_number && (
                                <p className="text-xs text-destructive">{form.formState.errors.account_number.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_account_number">
                                {t('buyer.account.bank.confirm_account_number', 'Confirm Account Number')}
                            </Label>
                            <Input
                                id="confirm_account_number"
                                type="password"
                                placeholder={t('buyer.account.bank.placeholder_confirm', 'Re-enter account number')}
                                {...form.register('confirm_account_number')}
                            />
                            {form.formState.errors.confirm_account_number && (
                                <p className="text-xs text-destructive">{form.formState.errors.confirm_account_number.message}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                {t('buyer.account.bank.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                {hasBankDetails
                                    ? t('buyer.account.bank.update', 'Update')
                                    : t('buyer.account.bank.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
