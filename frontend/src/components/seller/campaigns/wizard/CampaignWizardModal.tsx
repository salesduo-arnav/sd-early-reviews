import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Step1Product } from './Step1Product';
import { Step2Quota } from './Step2Quota';
import { Step3Guidelines } from './Step3Guidelines';
import { Step4Summary } from './Step4Summary';
import { toast } from 'sonner';
import { campaignsApi } from '@/api/campaigns';

export interface CampaignWizardData {
    asin: string;
    region: string;
    category: string;
    target: number;
    reimbursementPercentage: number;
    guidelines: string;
    product_title?: string;
    product_image_url?: string;
    product_description?: string;
    product_price?: number;
    product_rating?: number;
    product_rating_count?: number;
}

const INITIAL_DATA: CampaignWizardData = {
    asin: '',
    region: '',
    category: '',
    target: 0,
    reimbursementPercentage: 100,
    guidelines: '',
    product_title: '',
    product_image_url: '',
    product_description: '',
    product_price: 0,
    product_rating: undefined,
    product_rating_count: undefined,
};

interface CampaignWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CampaignWizardModal({ open, onOpenChange, onSuccess }: CampaignWizardModalProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<CampaignWizardData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const STEPS = [
        { id: 1, title: t('seller.campaigns.wizard.steps.product_details', 'Product Details') },
        { id: 2, title: t('seller.campaigns.wizard.steps.quota_pricing', 'Quota & Pricing') },
        { id: 3, title: t('seller.campaigns.wizard.steps.guidelines', 'Guidelines') },
        { id: 4, title: t('seller.campaigns.wizard.steps.summary_checkout', 'Summary & Checkout') }
    ];

    const updateData = (newData: Partial<CampaignWizardData>) => {
        setData(prev => ({ ...prev, ...newData }));
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await campaignsApi.createCampaign({
                asin: data.asin,
                region: data.region,
                category: data.category || 'Uncategorized',
                target_reviews: data.target,
                reimbursement_percent: data.reimbursementPercentage,
                guidelines: data.guidelines,
                product_title: data.product_title || `Campaign for ${data.asin}`,
                product_image_url: data.product_image_url || '',
                product_description: data.product_description || '',
                product_price: data.product_price || 0,
                product_rating: data.product_rating,
                product_rating_count: data.product_rating_count,
            });
            toast.success(t('seller.campaigns.wizard.success', 'Campaign published successfully!'));
            onSuccess();
            handleClose();
        } catch (error) {
            toast.error(t('seller.campaigns.wizard.error', 'Failed to publish campaign'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset after animation completes
        setTimeout(() => {
            setCurrentStep(1);
            setData(INITIAL_DATA);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="bg-muted/30 px-6 py-4 border-b">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-2xl font-bold">{t('seller.campaigns.wizard.title', 'Create New Campaign')}</DialogTitle>
                        <DialogDescription>
                            {t('seller.campaigns.wizard.desc', 'Follow the steps to setup your product review campaign.')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Stepper Indicator */}
                <div className="px-6 py-4 bg-background border-b flex items-center justify-center sm:justify-start space-x-2 md:space-x-4">
                    {STEPS.map((step) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center gap-2 ${currentStep === step.id ? 'opacity-100' : currentStep > step.id ? 'opacity-80' : 'opacity-40'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep === step.id
                                    ? 'bg-brand-primary text-primary-foreground shadow-md'
                                    : currentStep > step.id
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted-foreground/20 text-muted-foreground'
                                    }`}>
                                    {currentStep > step.id ? '✓' : step.id}
                                </div>
                                <span className="text-xs font-semibold hidden sm:block">
                                    {step.title}
                                </span>
                            </div>
                            {step.id < STEPS.length && (
                                <div className={`w-4 md:w-8 h-[2px] ml-2 md:ml-4 ${currentStep > step.id ? 'bg-green-500/50' : 'bg-muted-foreground/20'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {currentStep === 1 && <Step1Product data={data} updateData={updateData} onNext={handleNext} />}
                    {currentStep === 2 && <Step2Quota data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 3 && <Step3Guidelines data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />}
                    {currentStep === 4 && <Step4Summary data={data} onBack={handleBack} onSubmit={handleSubmit} isSubmitting={isSubmitting} />}
                </div>
            </DialogContent>
        </Dialog>
    );
}
