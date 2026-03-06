import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CampaignWizardData } from '../wizard/CampaignWizardModal';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface Step2QuotaProps {
    data: CampaignWizardData;
    updateData: (data: Partial<CampaignWizardData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step2Quota({ data, updateData, onNext, onBack }: Step2QuotaProps) {
    const { t } = useTranslation();

    const isNextDisabled = data.target <= 0 || !data.target || data.reimbursementPercentage <= 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-8">
                <div className="space-y-3">
                    <Label htmlFor="target" className="text-base">{t('seller.campaigns.wizard.target_reviews', 'Target Number of Reviews')}</Label>
                    <p className="text-sm text-muted-foreground">{t('seller.campaigns.wizard.target_desc', 'How many units would you like to distribute for this campaign?')}</p>
                    <Input
                        id="target"
                        type="number"
                        min={1}
                        placeholder="e.g. 50"
                        value={data.target || ''}
                        onChange={(e) => updateData({ target: parseInt(e.target.value) || 0 })}
                        className="text-lg py-6 max-w-[200px]"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <Label className="text-base">{t('seller.campaigns.wizard.reimbursement', 'Reimbursement Percentage')}</Label>
                            <p className="text-sm text-muted-foreground">{t('seller.campaigns.wizard.reimbursement_desc', 'What percentage of the product price will you reimburse to the buyer?')}</p>
                        </div>
                        <span className="text-3xl font-bold text-brand-primary">{data.reimbursementPercentage}%</span>
                    </div>

                    <div className="pt-4 pb-2">
                        <Slider
                            defaultValue={[data.reimbursementPercentage]}
                            max={100}
                            min={10}
                            step={5}
                            onValueChange={(vals) => updateData({ reimbursementPercentage: vals[0] })}
                            className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-brand-primary"
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10%</span>
                        <span>50%</span>
                        <span>100% ({t('seller.campaigns.wizard.recommended', 'Recommended')})</span>
                    </div>
                </div>

                <Card className="bg-secondary/20 border-secondary/50 shadow-none">
                    <CardContent className="p-4 flex gap-3 text-sm">
                        <Info className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">{t('seller.campaigns.wizard.pro_tip', 'Pro Tip: Higher Reimbursements Convert Faster')}</p>
                            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                {t('seller.campaigns.wizard.pro_tip_desc', 'Campaigns offering 100% reimbursement tend to fulfill their review quotas 3x faster than campaigns offering partial reimbursements.')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-6 flex justify-between border-t border-border mt-8">
                <Button onClick={onBack} variant="outline" size="lg">
                    {t('common.back', 'Back')}
                </Button>
                <Button onClick={onNext} disabled={isNextDisabled} size="lg" className="w-full sm:w-auto ml-4">
                    {t('common.next', 'Continue')}
                </Button>
            </div>
        </div>
    );
}
