import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Campaign } from '@/api/campaigns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CampaignCardProps {
    campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const targetDivisor = campaign.target_reviews > 0 ? campaign.target_reviews : 1;
    const progressPercent = Math.min((campaign.claimed_count / targetDivisor) * 100, 100);
    const isCompleted = campaign.status === 'COMPLETED' || campaign.claimed_count >= campaign.target_reviews;

    const handleClick = () => {
        navigate(`/seller/campaigns/${campaign.id}`);
    };

    const StatusBadge = () => {
        switch (campaign.status) {
            case 'ACTIVE':
                return <Badge variant="outline" className="bg-brand-primary/20 text-brand-primary border-brand-primary/20">{t('seller.campaigns.status.active', 'Active')}</Badge>;
            case 'PAUSED':
                return <Badge variant="outline" className="bg-gray-500/20 text-gray-500 border-gray-500/20">{t('seller.campaigns.status.paused', 'Paused')}</Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">{t('seller.campaigns.status.completed', 'Completed')}</Badge>;
            default:
                return null;
        }
    };

    return (
        <Card
            className="shadow-sm border-border flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer duration-200 group"
            onClick={handleClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4 items-center w-full">
                        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden border border-border">
                            {campaign.product_image_url ? (
                                <img src={campaign.product_image_url} alt={campaign.product_title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="h-full w-full bg-secondary/50 flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight mb-1" title={campaign.product_title}>
                                {campaign.product_title}
                            </CardTitle>
                            <CardDescription className="text-sm font-medium">
                                ASIN: <span className="uppercase text-foreground">{campaign.asin}</span>
                                {campaign.product_rating != null && (
                                    <p className="text-sm text-amber-500 font-medium">
                                        ★ {Number(campaign.product_rating).toFixed(1)}
                                        {campaign.product_rating_count != null && (
                                            <span className="text-muted-foreground font-normal ml-1">({Number(campaign.product_rating_count).toLocaleString()})</span>
                                        )}
                                    </p>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mt-2 space-y-3">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground font-medium">{t('seller.campaigns.claimed', 'Claimed Units')}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{campaign.claimed_count}</span>
                            <span className="text-muted-foreground">/ {campaign.target_reviews}</span>
                        </div>
                    </div>
                    <Progress value={progressPercent} className={`h-2.5 ${isCompleted ? '[&>div]:bg-green-600' : campaign.status === 'PAUSED' ? '[&>div]:bg-gray-300' : '[&>div]:bg-brand-primary'}`} />

                    <div className="flex justify-between items-center pt-2">
                        <StatusBadge />
                        <span className="text-xs text-muted-foreground">
                            {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
