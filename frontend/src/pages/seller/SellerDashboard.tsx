import { useTranslation } from 'react-i18next';
import { DashboardMetrics } from '@/components/seller/dashboard/DashboardMetrics';
import { ReviewVelocityChart } from '@/components/seller/dashboard/ReviewVelocityChart';
import { CampaignProgressCards } from '@/components/seller/dashboard/CampaignProgressCards';

export default function SellerDashboard() {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('seller.welcome_title', 'Welcome, Seller!')}</h1>
                <p className="text-muted-foreground mt-2">{t('seller.welcome_subtitle', 'Manage your campaigns and track incoming reviews.')}</p>
            </div>

            <DashboardMetrics />

            <div className="flex flex-col gap-8">
                <ReviewVelocityChart />
                <CampaignProgressCards />
            </div>
        </div>
    );
}
