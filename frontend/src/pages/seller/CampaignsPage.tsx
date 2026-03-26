import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { campaignsApi, Campaign, PaginationMeta } from '@/api/campaigns';
import { CampaignList } from '@/components/seller/campaigns/CampaignList';
import { CampaignWizardModal } from '@/components/seller/campaigns/wizard/CampaignWizardModal';
import { AppPagination } from '@/components/common/AppPagination';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { PageMeta } from '@/components/PageMeta';

const PAGE_SIZE = 12;

type PaymentBanner = 'success' | 'cancelled' | null;

export default function CampaignsPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentBanner, setPaymentBanner] = useState<PaymentBanner>(null);

    // Handle return from Stripe Checkout
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'success' || paymentStatus === 'cancelled') {
            setPaymentBanner(paymentStatus);
            searchParams.delete('payment');
            searchParams.delete('campaign');
            setSearchParams(searchParams, { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only; including searchParams would re-trigger after it deletes the param
    }, []);

    const loadCampaigns = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await campaignsApi.getCampaigns(page, PAGE_SIZE);
            setCampaigns(result.data);
            setPagination(result.pagination);
        } catch (err) {
            setError(getErrorMessage(err));
            toast.error(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCampaigns(currentPage);
    }, [loadCampaigns, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSuccess = () => {
        setCurrentPage(1);
        loadCampaigns(1);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageMeta title="Campaigns" description="Create and manage your product review campaigns. Track progress, pause or resume campaigns on SalesDuo." />
            {paymentBanner === 'success' && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-5 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                {t('seller.campaigns.payment_success_title', 'Payment successful!')}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {t('seller.campaigns.payment_success_desc', 'Your campaign is now live and visible to our reviewer pool.')}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50"
                        onClick={() => setPaymentBanner(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {paymentBanner === 'cancelled' && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40 px-5 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-orange-800 dark:text-orange-200">
                                {t('seller.campaigns.payment_cancelled_title', 'Payment cancelled')}
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                {t('seller.campaigns.payment_cancelled_desc', 'No charges were made. You can create a new campaign whenever you\'re ready.')}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/50"
                        onClick={() => setPaymentBanner(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('seller.nav.campaigns', 'Campaigns')}</h1>
                    <p className="text-muted-foreground mt-2">{t('seller.campaigns_page_desc', 'Manage all your active and past product campaigns.')}</p>
                </div>
                <Button
                    onClick={() => setIsWizardOpen(true)}
                    size="lg"
                    className="font-semibold shadow-sm w-full sm:w-auto hover:scale-[1.02] transition-transform"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('seller.campaigns.create_btn', 'Create Campaign')}
                </Button>
            </div>

            <CampaignList campaigns={campaigns} isLoading={isLoading} error={error} />

            {pagination && (
                <AppPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                />
            )}

            <CampaignWizardModal
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
