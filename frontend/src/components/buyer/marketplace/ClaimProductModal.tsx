import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Info, HelpCircle, CalendarIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageUpload } from '@/components/ui/image-upload';
import { buyerApi } from '@/api/buyer';
import type { MarketplaceProduct } from '@/api/buyer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClaimProductModalProps {
    product: MarketplaceProduct | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClaimSuccess: () => void;
}

const claimSchema = z.object({
    amazon_order_id: z
        .string()
        .min(1, 'Amazon Order ID is required')
        .regex(/^\d{3}-\d{7}-\d{7}$/, 'Order ID must follow the format: 123-4567890-1234567'),
    order_proof_url: z.string().min(1, 'Order screenshot is required'),
    purchase_date: z.string().min(1, 'Purchase date is required'),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export function ClaimProductModal({ product, open, onOpenChange, onClaimSuccess }: ClaimProductModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ClaimFormData>({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            amazon_order_id: '',
            order_proof_url: '',
            purchase_date: format(new Date(), 'yyyy-MM-dd'),
        },
    });

    const handleFileChange = (file: File | null) => {
        setProofFile(file);
        // Set a placeholder so Zod validation passes; actual URL is set on submit after S3 upload
        setValue('order_proof_url', file ? 'pending-upload' : '', { shouldValidate: true });
    };

    const handleClose = () => {
        reset();
        setError(null);
        setSelectedDate(new Date());
        setProofFile(null);
        onOpenChange(false);
    };

    const onSubmit = async (data: ClaimFormData) => {
        if (!product) return;

        if (!proofFile) {
            setError('Please upload an order screenshot.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Upload image to S3 only when submitting
            const { url } = await buyerApi.uploadImage(proofFile);

            await buyerApi.claimProduct(product.campaign_id, {
                amazon_order_id: data.amazon_order_id,
                order_proof_url: url,
                purchase_date: data.purchase_date,
            });

            toast.success(t('buyer.marketplace.claim_success', 'Product claimed successfully! Upload your review proof within 14 days.'));
            onClaimSuccess();
            handleClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to claim product';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{t('buyer.marketplace.claim_title', 'Claim Product')}</DialogTitle>
                    <DialogDescription>
                        {t(
                            'buyer.marketplace.claim_description',
                            'Submit your Amazon order details to claim this product for reimbursement.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Product summary */}
                <div className="flex gap-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="h-16 w-16 flex-shrink-0 rounded-md bg-background overflow-hidden border border-border">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.title}
                                className="h-full w-full object-contain p-1"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                No Image
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 leading-tight">{product.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold">${Number(product.price).toFixed(2)}</span>
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                +${product.reimbursement_amount} {t('buyer.marketplace.back', 'back')}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Claim form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Amazon Order ID */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Label htmlFor="amazon_order_id">
                                {t('buyer.marketplace.order_id_label', 'Amazon Order ID')}
                            </Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[240px]">
                                        <p className="text-xs">
                                            {t(
                                                'buyer.marketplace.order_id_tooltip',
                                                "Find your Order ID in 'Your Orders' on Amazon. It looks like: 123-4567890-1234567",
                                            )}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input
                            id="amazon_order_id"
                            placeholder="123-4567890-1234567"
                            {...register('amazon_order_id')}
                        />
                        {errors.amazon_order_id && (
                            <p className="text-xs text-destructive">{errors.amazon_order_id.message}</p>
                        )}
                    </div>

                    {/* Order Screenshot Upload */}
                    <div className="space-y-2">
                        <Label>
                            {t('buyer.marketplace.proof_upload_label', 'Order Screenshot')}
                        </Label>
                        <ImageUpload
                            file={proofFile}
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                        />
                        {errors.order_proof_url && (
                            <p className="text-xs text-destructive">{errors.order_proof_url.message}</p>
                        )}
                    </div>

                    {/* Purchase Date */}
                    <div className="space-y-2">
                        <Label>
                            {t('buyer.marketplace.purchase_date_label', 'Purchase Date')}
                        </Label>
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !selectedDate && 'text-muted-foreground',
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate
                                        ? format(selectedDate, 'PPP')
                                        : t('buyer.marketplace.select_date', 'Select purchase date')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                        if (date) {
                                            setValue('purchase_date', format(date, 'yyyy-MM-dd'), { shouldValidate: true });
                                        }
                                        setDatePickerOpen(false);
                                    }}
                                    disabled={{ after: new Date() }}
                                    toDate={new Date()}
                                    fromYear={2020}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.purchase_date && (
                            <p className="text-xs text-destructive">{errors.purchase_date.message}</p>
                        )}
                    </div>

                    {/* Guidelines */}
                    {product.guidelines && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                {t('buyer.marketplace.seller_guidelines', 'Seller Guidelines')}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 whitespace-pre-line">
                                {product.guidelines}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !proofFile}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('buyer.marketplace.claiming', 'Claiming...')}
                                </>
                            ) : (
                                t('buyer.marketplace.submit_claim', 'Submit Claim')
                            )}
                        </Button>
                    </DialogFooter>
                </form>

                {/* Info note */}
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Info className="h-3 w-3" />
                    {t(
                        'buyer.marketplace.claim_note',
                        'You have 14 days after claiming to submit your review proof.',
                    )}
                </p>
            </DialogContent>
        </Dialog>
    );
}
