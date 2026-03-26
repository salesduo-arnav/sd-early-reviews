import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { campaignsApi, Campaign } from '@/api/campaigns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, PauseCircle, PlayCircle, ExternalLink, Megaphone, ShoppingCart, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatPrice, getAmazonDomain } from '@/lib/regions';
import { PageMeta } from '@/components/PageMeta';

const CAMPAIGN_STEPS = [
    {
        icon: Megaphone,
        titleKey: 'seller.campaigns.detail.step_1_title',
        titleFallback: 'Campaign Published',
        descKey: 'seller.campaigns.detail.step_1_desc',
        descFallback: 'Your campaign goes live on the marketplace for verified buyers to discover.',
    },
    {
        icon: ShoppingCart,
        titleKey: 'seller.campaigns.detail.step_2_title',
        titleFallback: 'Buyers Purchase & Claim',
        descKey: 'seller.campaigns.detail.step_2_desc',
        descFallback: 'Buyers purchase your product on Amazon and submit their order proof for verification.',
    },
    {
        icon: Star,
        titleKey: 'seller.campaigns.detail.step_3_title',
        titleFallback: 'Reviews Submitted',
        descKey: 'seller.campaigns.detail.step_3_desc',
        descFallback: 'After order verification, buyers write honest reviews on Amazon within 14 days.',
    },
    {
        icon: CheckCircle2,
        titleKey: 'seller.campaigns.detail.step_4_title',
        titleFallback: 'Verified & Reimbursed',
        descKey: 'seller.campaigns.detail.step_4_desc',
        descFallback: 'Our team verifies each review. Once approved, reimbursement is sent to the buyer automatically.',
    },
];

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        if (!id) return;
        const loadCampaign = async () => {
            setIsLoading(true);
            try {
                const data = await campaignsApi.getCampaignById(id);
                if (data) {
                    setCampaign(data);
                } else {
                    toast.error(t('seller.campaigns.not_found', 'Campaign not found'));
                    navigate('/seller/campaigns');
                }
            } catch (err) {
                toast.error(t('seller.campaigns.fetch_error', 'Failed to load campaigns.'));
                navigate('/seller/campaigns');
            } finally {
                setIsLoading(false);
            }
        };
        loadCampaign();
    }, [id, navigate, t]);

    const handleTogglePause = async () => {
        if (!campaign) return;
        setIsToggling(true);
        try {
            const updated = await campaignsApi.togglePauseStatus(campaign.id);
            setCampaign(updated);
            toast.success(
                updated.status === 'PAUSED'
                    ? t('seller.campaigns.paused_success', 'Campaign paused successfully')
                    : t('seller.campaigns.resumed_success', 'Campaign resumed successfully')
            );
        } catch (err) {
            toast.error(t('seller.campaigns.toggle_error', 'Failed to update campaign status'));
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading || !campaign) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    const targetDivisor = campaign.target_reviews > 0 ? campaign.target_reviews : 1;
    const progressPercent = Math.min((campaign.claimed_count / targetDivisor) * 100, 100);
    const isCompleted = campaign.status === 'COMPLETED' || campaign.claimed_count >= campaign.target_reviews;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <PageMeta title={`Campaign: ${campaign.product_title || 'Details'}`} description={`Track progress and manage your campaign for ${campaign.product_title} on SalesDuo Early Reviews.`} />
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/seller/campaigns')} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('seller.campaigns.detail.title', 'Campaign Details')}</h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>ID: {campaign.id}</span>
                        <span>•</span>
                        <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {campaign.status !== 'COMPLETED' && (
                        <Button
                            variant={campaign.status === 'ACTIVE' ? 'outline' : 'default'}
                            onClick={handleTogglePause}
                            disabled={isToggling}
                            className={campaign.status === 'PAUSED' ? 'bg-brand-primary' : ''}
                        >
                            {isToggling ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : campaign.status === 'ACTIVE' ? (
                                <PauseCircle className="h-4 w-4 mr-2 text-orange-500" />
                            ) : (
                                <PlayCircle className="h-4 w-4 mr-2" />
                            )}
                            {campaign.status === 'ACTIVE'
                                ? t('seller.campaigns.detail.pause', 'Pause Campaign')
                                : t('seller.campaigns.detail.resume', 'Resume Campaign')}
                        </Button>
                    )}
                </div>
            </div>

            {/* How It Works — full width at top */}
            <div className="rounded-xl bg-brand-primary/5 p-6 sm:p-8">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight">
                        {t('seller.campaigns.detail.how_it_works', 'How It Works')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('seller.campaigns.detail.how_it_works_subtitle', 'Your campaign lifecycle from start to finish')}
                    </p>
                </div>

                <div className="relative">
                    {/* Continuous connector line behind icons — desktop only */}
                    <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-brand-primary/20" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
                        {CAMPAIGN_STEPS.map((step, index) => (
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Info Column */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-border overflow-hidden">
                        <div className="md:flex">
                            <div className="h-48 md:h-auto md:w-48 flex-shrink-0 bg-muted border-r border-border">
                                {campaign.product_image_url ? (
                                    <img src={campaign.product_image_url} alt={campaign.product_title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">No Image</div>
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h2 className="text-xl font-bold leading-tight">{campaign.product_title}</h2>
                                    <div className="flex-shrink-0">
                                        {campaign.status === 'ACTIVE' && <Badge className="bg-brand-primary">{t('seller.campaigns.status.active', 'Active')}</Badge>}
                                        {campaign.status === 'PAUSED' && <Badge variant="secondary" className="bg-orange-500 text-white">{t('seller.campaigns.status.paused', 'Paused')}</Badge>}
                                        {campaign.status === 'COMPLETED' && <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">{t('seller.campaigns.status.completed', 'Completed')}</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-foreground/80 mb-4 flex-wrap">
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border">ASIN: {campaign.asin}</span>
                                    <span>{campaign.category}</span>
                                    <a href={`https://www.${getAmazonDomain(campaign.region)}/dp/${campaign.asin}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-brand-primary cursor-pointer"><ExternalLink className="w-3 h-3 ml-1 mr-1" /> {getAmazonDomain(campaign.region)}</a>
                                    {campaign.product_rating != null && (
                                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-lg">
                                            ★ {Number(campaign.product_rating).toFixed(1)}
                                            {campaign.product_rating_count != null && (
                                                <span className="text-muted-foreground font-normal text-sm">
                                                    ({Number(campaign.product_rating_count).toLocaleString()} ratings)
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {campaign.product_description && <div className="mt-auto pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {campaign.product_description}
                                    </p>
                                </div>}
                            </div>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle className="text-lg">{t('seller.campaigns.detail.guidelines', 'Active Guidelines')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-secondary/20 p-4 rounded-md border border-secondary/50 text-sm whitespace-pre-wrap leading-relaxed">
                                {campaign.guidelines ? (
                                    campaign.guidelines
                                ) : (
                                    <span className="text-muted-foreground italic">{t('seller.campaigns.detail.no_guidelines', 'No guidelines specified for this campaign.')}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Metrics Column */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">{t('seller.campaigns.detail.progress', 'Campaign Progress')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <span className="text-3xl font-bold tracking-tight text-foreground">{campaign.claimed_count}</span>
                                            <span className="text-muted-foreground ml-1">/ {campaign.target_reviews}</span>
                                        </div>
                                        <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
                                    </div>
                                    <Progress value={progressPercent} className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : '[&>div]:bg-brand-primary'}`} />
                                    <p className="text-xs text-muted-foreground mt-2">{t('seller.campaigns.detail.claimed_desc', 'Reviews Completed')}</p>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-semibold mb-3">{t('seller.campaigns.detail.financials', 'Financial Setup')}</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('seller.campaigns.detail.product_price', 'Product Price')}</span>
                                            <span className="font-semibold">{formatPrice(campaign.product_price, campaign.region)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('seller.campaigns.detail.reimbursement', 'Reimbursement Rate')}</span>
                                            <span className="font-semibold text-brand-primary">{campaign.reimbursement_percent}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('seller.campaigns.detail.payout_per_review', 'Payout per Review')}</span>
                                            <span className="font-semibold text-green-600">
                                                {formatPrice(campaign.product_price * campaign.reimbursement_percent / 100, campaign.region)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('seller.campaigns.detail.upfront', 'Upfront Payment')}</span>
                                            <span className="font-medium text-foreground">Completed ✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-muted/30">
                        <CardContent className="p-4 text-sm">
                            <h4 className="font-semibold mb-1 text-foreground">{t('seller.campaigns.detail.need_help', 'Need Help?')}</h4>
                            <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                                {t('seller.campaigns.detail.help_desc', 'Modifying guidelines or targets for active campaigns requires platform approval to ensure fairness to existing claimants.')}
                            </p>
                            <Button variant="outline" className="w-full text-xs" size="sm">
                                {t('seller.campaigns.detail.contact_support', 'Contact Support')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
