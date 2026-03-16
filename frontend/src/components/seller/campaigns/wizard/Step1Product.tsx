import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, AlertTriangle } from 'lucide-react';
import { CampaignWizardData } from '../wizard/CampaignWizardModal';
import { campaignsApi } from '@/api/campaigns';
import { toast } from 'sonner';

interface Step1ProductProps {
    data: CampaignWizardData;
    updateData: (data: Partial<CampaignWizardData>) => void;
    onNext: () => void;
}

const REGIONS = [
    { value: 'com', label: 'United States (Amazon.com)' },
    { value: 'ca', label: 'Canada (Amazon.ca)' },
    { value: 'co.uk', label: 'United Kingdom (Amazon.co.uk)' },
    { value: 'de', label: 'Germany (Amazon.de)' },
    { value: 'fr', label: 'France (Amazon.fr)' },
    { value: 'it', label: 'Italy (Amazon.it)' },
    { value: 'es', label: 'Spain (Amazon.es)' },
    { value: 'jp', label: 'Japan (Amazon.co.jp)' },
    { value: 'in', label: 'India (Amazon.in)' },
    { value: 'cn', label: 'China (Amazon.cn)' },
    { value: 'ae', label: 'UAE (Amazon.ae)' },
    { value: 'sa', label: 'Saudi Arabia (Amazon.sa)' },
    { value: 'eg', label: 'Egypt (Amazon.eg)' },
];



export function Step1Product({ data, updateData, onNext }: Step1ProductProps) {
    const { t } = useTranslation();
    const [isFetching, setIsFetching] = useState(false);
    const [mockProduct, setMockProduct] = useState<{ title: string; image: string } | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleFetch = async () => {
        if (!data.asin || !data.region) {
            toast.error(t('seller.campaigns.wizard.missing_region_asin', 'Please provide an ASIN and select a Marketplace Region.'));
            return;
        }

        setIsFetching(true);
        setFetchError(null);
        setMockProduct(null);
        try {
            const response = await campaignsApi.lookupAsin(data.asin, data.region);

            // Client-side validation: ensure we got meaningful data back
            if (!response.product_title) {
                setFetchError('This ASIN was not found in the selected marketplace. Please double-check the ASIN and region.');
                return;
            }

            const priceString = response.product_price || '0';
            // Strip currency symbols; handle comma as decimal separator (e.g. "€29,99")
            const normalized = priceString.replace(/[^0-9.,]/g, '').replace(/,(\d{2})$/, '.$1').replace(/,/g, '');
            const price = parseFloat(normalized) || 0;

            // Client-side price validation as safety net
            if (price <= 0) {
                setFetchError('Product data appears incomplete — the price is unavailable or zero. Please try a different ASIN.');
                return;
            }

            updateData({
                product_title: response.product_title,
                product_image_url: response.product_photo,
                product_price: price,
                product_description: response.product_description
                    || (response.about_product?.length ? response.about_product.join('\n') : ''),
                category: response.category?.name || response.product_category || 'Uncategorized',
                product_rating: response.product_star_rating
                    ? parseFloat(response.product_star_rating.replace(/[^0-9.]/g, ''))
                    : undefined,
                product_rating_count: response.product_num_ratings ?? undefined,
            });

            setMockProduct({
                title: response.product_title,
                image: response.product_photo,
            });
            toast.success(t('seller.campaigns.wizard.fetch_success', 'Product details fetched successfully!'));
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            // Show the backend's descriptive message if available
            setFetchError(message || 'Failed to fetch product details. Please check the ASIN and selected region.');
            toast.error(message || t('seller.campaigns.wizard.fetch_error', 'Failed to fetch product details. Please check ASIN & Region.'));
        } finally {
            setIsFetching(false);
        }
    };

    const isNextDisabled = !data.asin || !data.region || !mockProduct;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="region">{t('seller.campaigns.wizard.region', 'Marketplace Region')}</Label>
                    <Select value={data.region} onValueChange={(v) => updateData({ region: v })}>
                        <SelectTrigger id="region">
                            <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[40vh]">
                            {REGIONS.map(region => (
                                <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="asin">{t('seller.campaigns.wizard.asin', 'Product ASIN')}</Label>
                    <div className="flex space-x-2">
                        <Input
                            id="asin"
                            placeholder="e.g. B08H12345A"
                            value={data.asin}
                            onChange={(e) => updateData({ asin: e.target.value.toUpperCase() })}
                            className="uppercase"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleFetch}
                            disabled={!data.asin || isFetching}
                            className="w-[140px] hover:bg-gray-200"
                        >
                            {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            {t('seller.campaigns.wizard.fetch', 'Fetch Details')}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('seller.campaigns.wizard.asin_help', 'Enter the 10-character Amazon Standard Identification Number.')}</p>
                </div>
            </div>

            {fetchError && !mockProduct && (
                <div className="mt-6 p-4 border border-destructive/30 rounded-lg bg-destructive/5 flex items-start space-x-3 animate-in zoom-in-95 duration-300">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-destructive mb-0.5">Product Lookup Failed</p>
                        <p className="text-sm text-muted-foreground">{fetchError}</p>
                    </div>
                </div>
            )}

            {mockProduct && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-card shadow-sm flex items-center space-x-4 animate-in zoom-in-95 duration-300">
                    <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                        <img src={mockProduct.image} alt={mockProduct.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('seller.campaigns.wizard.matched_product', 'Matched Product')}</p>
                        <h4 className="text-base font-semibold leading-tight line-clamp-2 break-words" title={mockProduct.title}>{mockProduct.title}</h4>
                    </div>
                </div>
            )}

            <div className="pt-6 flex justify-end border-t border-border mt-8">
                <Button onClick={onNext} disabled={isNextDisabled} size="lg" className="w-full sm:w-auto">
                    {t('common.next', 'Continue')}
                </Button>
            </div>
        </div>
    );
}
