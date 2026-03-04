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

    const targetDivisor = campaign.target > 0 ? campaign.target : 1;
    const progressPercent = Math.min((campaign.claimed / targetDivisor) * 100, 100);
    const isCompleted = campaign.status === 'completed' || campaign.claimed >= campaign.target;

    const handleClick = () => {
        navigate(`/seller/campaigns/${campaign.id}`);
    };

    const StatusBadge = () => {
        switch (campaign.status) {
            case 'active':
                return <Badge variant="default" className="bg-brand-primary text-primary-foreground">{t('seller.campaigns.status.active', 'Active')}</Badge>;
            case 'paused':
                return <Badge variant="secondary" className="bg-orange-500 text-white">{t('seller.campaigns.status.paused', 'Paused')}</Badge>;
            case 'completed':
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
                            {campaign.image ? (
                                <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="h-full w-full bg-secondary/50 flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight mb-1" title={campaign.title}>
                                {campaign.title}
                            </CardTitle>
                            <CardDescription className="text-sm font-medium">
                                ASIN: <span className="uppercase text-foreground">{campaign.asin}</span>
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground font-medium">{t('seller.campaigns.claimed', 'Claimed Units')}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{campaign.claimed}</span>
                            <span className="text-muted-foreground">/ {campaign.target}</span>
                        </div>
                    </div>
                    <Progress value={progressPercent} className={`h-2.5 ${isCompleted ? '[&>div]:bg-green-500' : '[&>div]:bg-brand-primary'}`} />

                    <div className="flex justify-between items-center pt-2">
                        <StatusBadge />
                        <span className="text-xs text-muted-foreground">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
