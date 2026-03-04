import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { CampaignWizardData } from '../wizard/CampaignWizardModal';

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

const CATEGORIES = [
    'Electronics', 'Home & Kitchen', 'Beauty & Personal Care', 'Health & Household',
    'Clothing & Accessories', 'Toys & Games', 'Sports & Outdoors', 'Automotive'
];

export function Step1Product({ data, updateData, onNext }: Step1ProductProps) {
    const { t } = useTranslation();
    const [isFetching, setIsFetching] = useState(false);
    const [mockProduct, setMockProduct] = useState<{ title: string; image: string } | null>(null);

    const handleFetch = () => {
        if (!data.asin) return;
        setIsFetching(true);
        // Simulate API call to fetch product details from Amazon ASIN
        setTimeout(() => {
            setMockProduct({
                title: 'Simulated Product Title for ' + data.asin + ' - Premium Quality Item',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2699&auto=format&fit=crop',
            });
            setIsFetching(false);
        }, 1500);
    };

    const isNextDisabled = !data.asin || !data.region || !data.category || !mockProduct;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="category">{t('seller.campaigns.wizard.category', 'Product Category')}</Label>
                        <Select value={data.category} onValueChange={(v) => updateData({ category: v })}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[40vh]">
                                {CATEGORIES.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                            className="w-[140px]"
                        >
                            {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            {t('seller.campaigns.wizard.fetch', 'Fetch Details')}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('seller.campaigns.wizard.asin_help', 'Enter the 10-character Amazon Standard Identification Number.')}</p>
                </div>
            </div>

            {mockProduct && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-card shadow-sm flex items-center space-x-4 animate-in zoom-in-95 duration-300">
                    <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                        <img src={mockProduct.image} alt={mockProduct.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('seller.campaigns.wizard.matched_product', 'Matched Product')}</p>
                        <h4 className="text-base font-semibold truncate" title={mockProduct.title}>{mockProduct.title}</h4>
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
