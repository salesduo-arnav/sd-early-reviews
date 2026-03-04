import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CampaignWizardData } from '../wizard/CampaignWizardModal';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Step3GuidelinesProps {
    data: CampaignWizardData;
    updateData: (data: Partial<CampaignWizardData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step3Guidelines({ data, updateData, onNext, onBack }: Step3GuidelinesProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Alert className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                <AlertCircle className="h-4 w-4" color="currentColor" />
                <AlertTitle>{t('seller.campaigns.wizard.tos.title', 'Amazon TOS Compliance Notice')}</AlertTitle>
                <AlertDescription className="text-xs">
                    {t('seller.campaigns.wizard.tos.desc', "Please ensure your guidelines strictly comply with Amazon's Terms of Service. Do not ask for guaranteed positive reviews or explicitly instruct the buyer not to mention the rebate.")}
                </AlertDescription>
            </Alert>

            <div className="space-y-3">
                <Label htmlFor="guidelines" className="text-base">
                    {t('seller.campaigns.wizard.guidelines', 'Review Guidelines & Buyer Instructions')}
                    <span className="text-muted-foreground font-normal ml-2">({t('seller.campaigns.wizard.optional', 'Optional')})</span>
                </Label>
                <p className="text-sm text-muted-foreground">{t('seller.campaigns.wizard.guidelines_desc', 'What specific aspects of the product do you want the reviewer to focus on? Provide clear and concise instructions.')}</p>
                <Textarea
                    id="guidelines"
                    placeholder="e.g. Please test the product for at least 3 days. Focus your review on the assembly process, material quality, and overall comfort. Photos of the product in use are highly appreciated."
                    value={data.guidelines}
                    onChange={(e) => updateData({ guidelines: e.target.value })}
                    className="min-h-[200px] resize-none text-base p-4"
                />
            </div>

            <div className="pt-6 flex justify-between border-t border-border mt-8">
                <Button onClick={onBack} variant="outline" size="lg">
                    {t('common.back', 'Back')}
                </Button>
                <Button onClick={onNext} size="lg" className="w-full sm:w-auto ml-4">
                    {t('common.next', 'Continue to Summary')}
                </Button>
            </div>
        </div>
    );
}
