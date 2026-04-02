import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    ExternalLink,
    ShoppingCart,
    Star,
    Upload,
    CheckCircle2,
    DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageMeta } from '@/components/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { buyerApi } from '@/api/buyer';
import type { MarketplaceProduct } from '@/api/buyer';
import { ClaimProductModal } from '@/components/buyer/marketplace/ClaimProductModal';
import { getAmazonDomain, getAmazonProductUrl, formatPrice, getCurrencySymbol } from '@/lib/regions';

const PROCESS_STEPS = [
    {
        icon: ShoppingCart,
        titleKey: 'buyer.product_detail.step_1_title',
        titleFallback: 'Purchase the Product',
        descKey: 'buyer.product_detail.step_1_desc',
        descFallback: 'Buy the product on Amazon using the link provided. Make sure to note your Order ID.',
    },
    {
        icon: Upload,
        titleKey: 'buyer.product_detail.step_2_title',
        titleFallback: 'Submit Your Claim',
        descKey: 'buyer.product_detail.step_2_desc',
        descFallback: 'Click "Claim Product" below and provide your Amazon Order ID, order screenshot, and purchase date.',
    },
    {
        icon: Star,
        titleKey: 'buyer.product_detail.step_3_title',
        titleFallback: 'Write Your Review',
        descKey: 'buyer.product_detail.step_3_desc',
        descFallback: 'After your order is verified, write an honest review on Amazon within 14 days and submit proof.',
    },
    {
        icon: DollarSign,
        titleKey: 'buyer.product_detail.step_4_title',
        titleFallback: 'Get Reimbursed',
        descKey: 'buyer.product_detail.step_4_desc',
        descFallback: 'Once your review is verified by our team, your reimbursement is processed to your account.',
    },
];

const DESC_TRUNCATE_LENGTH = 200;

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [product, setProduct] = useState<MarketplaceProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [claimModalOpen, setClaimModalOpen] = useState(false);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await buyerApi.getProductDetails(id);
            setProduct(data);
        } catch {
            toast.error(t('buyer.product_detail.not_found', 'Product not found or no longer available.'));
            navigate('/buyer/marketplace');
        } finally {
            setIsLoading(false);
        }
    }, [id, t, navigate]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const handleClaimSuccess = () => {
        navigate('/buyer/claims');
    };

    if (isLoading || !product) {
        return (
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                {/* Back button + header */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                {/* How It Works — static, renders immediately */}
                <div className="rounded-xl bg-brand-primary/5 p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold tracking-tight">
                            {t('buyer.product_detail.how_it_works', 'How It Works')}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('buyer.product_detail.how_it_works_subtitle', 'Earn reimbursements in 4 simple steps')}
                        </p>
                    </div>
                    <div className="relative">
                        <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-brand-primary/20" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
                            {PROCESS_STEPS.map((step, index) => (
                                <div key={index} className="relative flex flex-col items-center text-center px-4">
                                    <div className="relative z-10 flex items-center justify-center h-14 w-14 rounded-full bg-brand-primary text-white mb-4 shadow-md">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold mb-1">{t(step.titleKey, step.titleFallback)}</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{t(step.descKey, step.descFallback)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Two-column layout skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {/* Product card skeleton */}
                        <Card className="shadow-sm border-border overflow-hidden">
                            <div className="md:flex">
                                <Skeleton className="h-64 md:h-full md:w-64 flex-shrink-0" />
                                <div className="p-6 flex-1 min-w-0 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="flex gap-3 flex-wrap">
                                        <Skeleton className="h-5 w-20 rounded" />
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-40" />
                                    <div className="pt-4 border-t border-border space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        {/* Guidelines skeleton */}
                        <Card className="shadow-sm border-border min-h-[22vh]">
                            <CardHeader>
                                <CardTitle className="text-lg">{t('buyer.product_detail.guidelines_title', 'Seller Guidelines')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Right column skeleton */}
                    <div className="flex flex-col gap-6">
                        <Card className="shadow-sm border-border">
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-3 w-36 mt-2" />
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-5 w-12 rounded-full" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-border">
                            <CardContent className="p-5 space-y-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-border bg-muted/30">
                            <CardContent className="p-5 space-y-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const domain = getAmazonDomain(product.region);
    const amazonUrl = getAmazonProductUrl(product.region, product.asin);
    const slotsAvailable = product.slots_remaining > 0;
    const descIsLong = product.description && product.description.length > DESC_TRUNCATE_LENGTH;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <PageMeta title={product.title || 'Product Details'} description={`Claim ${product.title} and get reimbursed for your honest review. ${product.reimbursement_pct}% reimbursement available.`} />
            {/* Back button + header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/buyer/marketplace')}
                    className="rounded-full"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('buyer.product_detail.title', 'Product Details')}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>ASIN: {product.asin}</span>
                        <span>•</span>
                        <span>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* How it Works — full width at top */}
            <div className="rounded-xl bg-brand-primary/5 p-6 sm:p-8">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight">
                        {t('buyer.product_detail.how_it_works', 'How It Works')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('buyer.product_detail.how_it_works_subtitle', 'Earn reimbursements in 4 simple steps')}
                    </p>
                </div>

                <div className="relative">
                    {/* Continuous connector line behind icons — desktop only */}
                    <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-brand-primary/20" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
                        {PROCESS_STEPS.map((step, index) => (
                            <div key={index} className="relative flex flex-col items-center text-center px-4">
                                <div className="relative z-10 flex items-center justify-center h-14 w-14 rounded-full bg-brand-primary text-white mb-4 shadow-md">
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-bold mb-1">
                                    {t(step.titleKey, step.titleFallback)}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                                    {t(step.descKey, step.descFallback)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Left column: product info + guidelines */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    {/* Product card */}
                    <Card className="shadow-sm border-border overflow-hidden">
                        <div className="md:flex">
                            {/* Fixed-size image container */}
                            <div className="h-64 md:h-auto md:w-64 flex-shrink-0 bg-muted border-b md:border-b-0 md:border-r border-border flex items-center justify-center">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="max-h-64 w-auto object-contain p-4"
                                    />
                                ) : (
                                    <div className="text-muted-foreground text-sm">No Image</div>
                                )}
                            </div>
                            <div className="p-6 flex-1 min-w-0">
                                <h2 className="text-xl font-bold leading-tight mb-3">{product.title}</h2>

                                <div className="flex items-center gap-3 text-sm text-foreground/80 mb-4 flex-wrap">
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border">
                                        ASIN: {product.asin}
                                    </span>
                                    <span>{product.category}</span>
                                    {product.rating != null && (
                                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-lg">
                                            ★ {Number(product.rating).toFixed(1)}
                                            {product.rating_count != null && (
                                                <span className="text-muted-foreground font-normal text-sm">
                                                    ({Number(product.rating_count).toLocaleString()} ratings)
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Company name */}
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('buyer.product_detail.by', 'By')}{' '}
                                    <span className="font-medium text-foreground">{product.company_name}</span>
                                </p>

                                {/* Amazon link */}
                                <a
                                    href={amazonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm hover:text-brand-dark transition-colors text-primary mb-4"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    {t('buyer.product_detail.view_on', 'View on')} {domain}
                                </a>

                                {/* Description with read-more */}
                                {product.description && (
                                    <div className="pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {descIsLong
                                                ? product.description.slice(0, DESC_TRUNCATE_LENGTH) + '...'
                                                : product.description}
                                        </p>
                                        {descIsLong && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-1">
                                                        {t('buyer.product_detail.read_more', 'Read more')}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>{t('buyer.product_detail.description_title', 'Product Description')}</DialogTitle>
                                                    </DialogHeader>
                                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {product.description}
                                                    </p>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Guidelines */}
                    <Card className="shadow-sm border-border min-h-[22vh]">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {t('buyer.product_detail.guidelines_title', 'Seller Guidelines')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {product.guidelines ? (
                                <div className="bg-secondary/20 p-4 rounded-md border border-secondary/50 text-sm whitespace-pre-wrap leading-relaxed">
                                    {product.guidelines}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    {t('buyer.product_detail.no_guidelines', 'No specific guidelines mentioned by the seller.')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: pricing + claim */}
                <div className="flex flex-col gap-6">
                    {/* Pricing card */}
                    <Card className="shadow-sm border-border">
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <span className="text-3xl font-bold">{formatPrice(product.price, product.region)}</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('buyer.product_detail.product_price', 'Product price on Amazon')}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {t('buyer.product_detail.reimbursement_rate', 'Reimbursement')}
                                    </span>
                                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                        {product.reimbursement_pct}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {t('buyer.product_detail.you_get_back', 'You get back')}
                                    </span>
                                    <span className="text-green-600 font-bold text-lg">
                                        {formatPrice(Number(product.reimbursement_amount), product.region)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {t('buyer.marketplace.slots_remaining', 'Slots remaining')}
                                </span>
                                <span
                                    className={`font-semibold ${product.slots_remaining <= 3 ? 'text-orange-500' : 'text-foreground'}`}
                                >
                                    {product.slots_remaining} / {product.target_reviews}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amazon link card */}
                    <Card className="shadow-sm border-border">
                        <CardContent className="p-5">
                            <p className="text-xs text-muted-foreground mb-3">
                                {t(
                                    'buyer.product_detail.not_purchased_yet',
                                    'Haven\'t purchased yet? Buy it on Amazon first, then come back to claim.',
                                )}
                            </p>
                            <Button variant="outline" className="w-full" asChild>
                                <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t('buyer.product_detail.view_on', 'View on')} {domain}
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Claim CTA card */}
                    <Card className="shadow-sm border-border bg-muted/30">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                                <h3 className="font-semibold text-sm">
                                    {t('buyer.product_detail.already_purchased', 'Already purchased? Claim here')}
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t(
                                    'buyer.product_detail.claim_helper',
                                    'If you\'ve already bought this product on Amazon, click below to submit your order details and start the reimbursement process.',
                                )}
                            </p>
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={!slotsAvailable}
                                onClick={() => setClaimModalOpen(true)}
                            >
                                {slotsAvailable
                                    ? t('buyer.marketplace.claim_product', 'Claim Product')
                                    : t('buyer.marketplace.sold_out', 'Sold Out')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Claim Modal */}
            <ClaimProductModal
                product={product}
                open={claimModalOpen}
                onOpenChange={setClaimModalOpen}
                onClaimSuccess={handleClaimSuccess}
            />
        </div>
    );
}
