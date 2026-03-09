import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MarketplaceProduct } from '@/api/buyer';

interface MarketplaceProductCardProps {
    product: MarketplaceProduct;
}

export function MarketplaceProductCard({ product }: MarketplaceProductCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClick = () => navigate(`/buyer/marketplace/${product.id}`);

    return (
        <Card
            className="shadow-sm border-border flex flex-col hover:shadow-lg hover:border-brand-primary/40 transition-all duration-200 group overflow-hidden cursor-pointer"
            onClick={handleClick}
        >
            {/* Product Image */}
            <div className="relative aspect-[4/3] bg-muted overflow-hidden border-b border-border">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No Image
                    </div>
                )}

                {/* Reimbursement badge */}
                <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold">
                    {product.reimbursement_pct}% Back
                </Badge>
            </div>

            <CardContent className="flex flex-col flex-1 p-4 gap-2">
                {/* Title — fixed 2-line height */}
                <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-brand-primary transition-colors" title={product.title}>
                    {product.title}
                </h3>

                {/* Rating & Company */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {product.rating != null ? (
                        <span className="text-amber-500 font-medium">
                            ★ {Number(product.rating).toFixed(1)}
                            {product.rating_count != null && (
                                <span className="text-muted-foreground ml-1">
                                    ({Number(product.rating_count).toLocaleString()})
                                </span>
                            )}
                        </span>
                    ) : (
                        <span>No rating</span>
                    )}
                    <span className="truncate ml-2 max-w-[45%] text-right" title={product.company_name}>
                        {product.company_name}
                    </span>
                </div>

                {/* Price & Reimbursement */}
                <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold">${Number(product.price).toFixed(2)}</span>
                        <span className="text-sm font-semibold text-green-600">
                            +${product.reimbursement_amount} {t('buyer.marketplace.back', 'back')}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ASIN: <span className="uppercase font-mono">{product.asin}</span>
                    </p>
                </div>

                {/* Slots remaining */}
                <div className="text-xs text-muted-foreground">
                    <span className={`font-medium ${product.slots_remaining <= 3 ? 'text-orange-500' : 'text-foreground'}`}>
                        {product.slots_remaining}
                    </span>{' '}
                    {t('buyer.marketplace.slots_remaining', 'slots remaining')}
                </div>

                {/* Spacer pushes button to bottom */}
                <div className="flex-1" />

                {/* View Details button — full width, prominent on hover */}
                <Button
                    size="sm"
                    variant='outline'
                    onClick={handleClick}
                >
                    {t('buyer.marketplace.view_details', 'View Details')}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
            </CardContent>
        </Card>
    );
}
