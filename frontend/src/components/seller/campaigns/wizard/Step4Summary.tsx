import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CampaignWizardData } from '../wizard/CampaignWizardModal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { configApi } from '@/api/config';

interface Step4SummaryProps {
    data: CampaignWizardData;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function Step4Summary({ data, onBack, onSubmit, isSubmitting }: Step4SummaryProps) {
    const { t } = useTranslation();
    const [platformFeePercent, setPlatformFeePercent] = useState<number | null>(null);

    useEffect(() => {
        configApi.getPublicConfig()
            .then(cfg => setPlatformFeePercent(Number(cfg.platform_fee_percent)))
            .catch(() => setPlatformFeePercent(10)); // fallback to 10% on error
    }, []);

    const simulatedProductPrice = data.product_price || 0;
    const itemCost = simulatedProductPrice * (data.reimbursementPercentage / 100);
    const totalItemCost = itemCost * data.target;
    const feeMultiplier = (platformFeePercent ?? 0) / 100;
    const totalPlatformFee = totalItemCost * feeMultiplier;
    const orderTotal = totalItemCost + totalPlatformFee;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">{t('seller.campaigns.wizard.summary.campaign_details', 'Campaign Details')}</h3>
                        <div className="mt-4 space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                <span className="text-muted-foreground">{t('seller.campaigns.wizard.summary.asin', 'ASIN')}</span>
                                <span className="font-medium uppercase">{data.asin}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                <span className="text-muted-foreground">{t('seller.campaigns.wizard.summary.target', 'Target Reviews')}</span>
                                <span className="font-medium">{data.target} Units</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                <span className="text-muted-foreground">{t('seller.campaigns.wizard.summary.reimbursement', 'Reimbursement')}</span>
                                <span className="font-medium">{data.reimbursementPercentage}%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                <span className="text-muted-foreground">{t('seller.campaigns.wizard.summary.region', 'Region')}</span>
                                <span className="font-medium leading-none">{data.region}</span>
                            </div>
                        </div>
                    </div>

                    <Card className="bg-primary/5 border-primary/20 shadow-none">
                        <CardContent className="p-4 flex gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">{t('seller.campaigns.wizard.summary.guaranteed', 'Secure & Fast Execution')}</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {t('seller.campaigns.wizard.summary.guaranteed_desc', 'Your campaign will be published immediately to our verified reviewer pool. Funds are held securely until reviews are verified.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="border-border shadow-md h-full">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold tracking-tight mb-4">{t('seller.campaigns.wizard.summary.financials', 'Order Summary')}</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('seller.campaigns.wizard.summary.reimb_cost', 'Reimbursement Cost')}</span>
                                    <span>${itemCost.toFixed(2)} x {data.target}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span>{t('seller.campaigns.wizard.summary.total_reimb', 'Total Reimbursement')}</span>
                                    <span>${totalItemCost.toFixed(2)}</span>
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t('seller.campaigns.wizard.summary.platform_fee', 'Platform Fee')}</span>
                                        <span>
                                            {platformFeePercent === null
                                                ? <Loader2 className="w-4 h-4 animate-spin inline" />
                                                : `${platformFeePercent}% of reimbursement`
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-medium mt-1">
                                        <span>{t('seller.campaigns.wizard.summary.total_fee', 'Total Platform Fee')}</span>
                                        <span>${totalPlatformFee.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="flex flex-col mb-6">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>{t('seller.campaigns.wizard.summary.total', 'Total Cost')}</span>
                                    <span className="text-brand-primary">${orderTotal.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-right mt-1">{t('seller.campaigns.wizard.summary.due_today', 'Due today via Stripe Checkout')}</p>
                            </div>

                            <Button
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                size="lg"
                                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-primary-foreground font-semibold h-12"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <CreditCard className="w-5 h-5 mr-2" />
                                )}
                                {isSubmitting ? t('seller.campaigns.wizard.summary.processing', 'Processing Payment...') : t('seller.campaigns.wizard.summary.pay', 'Pay & Publish Campaign')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="pt-6 flex justify-between border-t border-border mt-8">
                <Button onClick={onBack} variant="outline" size="lg" disabled={isSubmitting}>
                    {t('common.back', 'Back')}
                </Button>
            </div>
        </div>
    );
}
