import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';

const OnboardingPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, tokens, completeOnboarding } = useAuthStore();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);

    // Buyer fields
    const [amazonUrl, setAmazonUrl] = useState('');
    const [region, setRegion] = useState('com');

    // Seller fields
    const [companyName, setCompanyName] = useState('');

    // Kick out users who shouldn't be here
    if (!user || user.role === 'ADMIN' || user.has_profile) {
        navigate('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tokens?.accessToken) {
            toast.error(t('onboarding.auth_error', 'Authentication error. Please login again.'));
            return;
        }

        try {
            setIsLoading(true);
            const data = user.role === 'BUYER' ? {
                amazon_profile_url: amazonUrl,
                region
            } : {
                company_name: companyName
            };

            await authApi.onboarding(data);
            completeOnboarding();
            toast.success(t('onboarding.success', 'Onboarding completed!'));

            // Send them to their dashboard
            if (user.role === 'BUYER') navigate('/buyer');
            else if (user.role === 'SELLER') navigate('/seller');

        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('onboarding.fail', 'Failed to complete onboarding. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const leftContent = user?.role === 'BUYER' ? {
        title: t('onboarding.buyer_split_title', 'Unlock Premium Products'),
        subtitle: t('onboarding.buyer_split_subtitle', 'Complete your profile to start requesting high-quality products for free or at massive discounts.'),
        features: [
            {
                title: t('onboarding.buyer_feature_1_title', 'Connect Your Amazon'),
                description: t('onboarding.buyer_feature_1_desc', 'Link your profile so sellers can verify your review quality.')
            },
            {
                title: t('onboarding.buyer_feature_2_title', 'Claim Your Deals'),
                description: t('onboarding.buyer_feature_2_desc', 'Browse our marketplace and request items you actually want.')
            }
        ]
    } : {
        title: t('onboarding.seller_split_title', 'Grow Your Brand'),
        subtitle: t('onboarding.seller_split_subtitle', 'Provide your company details to start connecting with top-tier reviewers and boosting your sales.'),
        features: [
            {
                title: t('onboarding.seller_feature_1_title', 'Verify Your Business'),
                description: t('onboarding.seller_feature_1_desc', 'Add your company name to build trust with our reviewer community.')
            },
            {
                title: t('onboarding.seller_feature_2_title', 'Launch Campaigns'),
                description: t('onboarding.seller_feature_2_desc', 'Create targeted review campaigns in minutes and watch your rankings climb.')
            }
        ]
    };

    return (
        <SplitScreenLayout leftContent={leftContent}>
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
                    {t('onboarding.title', 'Complete your profile')}
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    {user.role === 'BUYER' ? t('onboarding.subtitle_buyer', 'Just a few more details to set up your buyer account.') : t('onboarding.subtitle_seller', 'Just a few more details to set up your seller account.')}
                </p>
            </div>

            <div className="mt-8">
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {user.role === 'BUYER' ? (
                        <>
                            <div>
                                <Label htmlFor="region">{t('auth.region', 'Region')}</Label>
                                <div className="mt-1 flex flex-col space-y-1">
                                    <Select onValueChange={(val) => setRegion(val)} defaultValue={region}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('onboarding.select_region', 'Select Region')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ca">{t('onboarding.countries.ca', 'Canada')}</SelectItem>
                                            <SelectItem value="cn">{t('onboarding.countries.cn', 'China')}</SelectItem>
                                            <SelectItem value="eg">{t('onboarding.countries.eg', 'Egypt')}</SelectItem>
                                            <SelectItem value="fr">{t('onboarding.countries.fr', 'France')}</SelectItem>
                                            <SelectItem value="de">{t('onboarding.countries.de', 'Germany')}</SelectItem>
                                            <SelectItem value="in">{t('onboarding.countries.in', 'India')}</SelectItem>
                                            <SelectItem value="it">{t('onboarding.countries.it', 'Italy')}</SelectItem>
                                            <SelectItem value="jp">{t('onboarding.countries.jp', 'Japan')}</SelectItem>
                                            <SelectItem value="sa">{t('onboarding.countries.sa', 'Saudi Arabia')}</SelectItem>
                                            <SelectItem value="es">{t('onboarding.countries.es', 'Spain')}</SelectItem>
                                            <SelectItem value="ae">{t('onboarding.countries.ae', 'UAE')}</SelectItem>
                                            <SelectItem value="co.uk">{t('onboarding.countries.co.uk', 'United Kingdom')}</SelectItem>
                                            <SelectItem value="com">{t('onboarding.countries.com', 'United States')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="amazonUrl">{t('auth.amazon_profile_url', 'Amazon Profile URL')}</Label>
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[250px] p-3 text-sm flex flex-col border border-border bg-popover text-popover-foreground shadow-md">
                                                <p>{t('onboarding.amazon_profile_help_1', 'To find your profile URL, go to ')}<a href={`https://amazon.${region || 'com'}/gp/profile`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">amazon.{region || 'com'}/gp/profile</a>{t('onboarding.amazon_profile_help_2', ' while logged into your Amazon account.')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="mt-1">
                                    <Input
                                        id="amazonUrl"
                                        name="amazonUrl"
                                        type="url"
                                        required
                                        value={amazonUrl}
                                        onChange={(e) => setAmazonUrl(e.target.value)}
                                        placeholder={`https://amazon.${region || 'com'}/gp/profile/amzn1.account...`}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Label htmlFor="companyName">{t('auth.company_name', 'Company Name')}</Label>
                                <div className="mt-1">
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <Button
                            type="submit"
                            className="w-full flex justify-center py-6 px-4 rounded-xl shadow-md text-base font-semibold transition-transform active:scale-95"
                            disabled={isLoading}
                        >
                            {isLoading ? t('onboarding.saving', 'Saving...') : t('onboarding.complete_setup', 'Complete Setup')}
                        </Button>
                    </div>
                </form>
            </div>
        </SplitScreenLayout>
    );
};

export default OnboardingPage;
