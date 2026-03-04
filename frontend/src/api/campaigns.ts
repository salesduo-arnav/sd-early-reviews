export type CampaignStatus = 'active' | 'paused' | 'completed';

export interface Campaign {
    id: string;
    title: string;
    asin: string;
    image: string;
    target: number;
    claimed: number;
    region: string;
    category: string;
    status: CampaignStatus;
    guidelines: string;
    productDescription: string;
    createdAt: string;
    reimbursementPercentage: number;
}

const mockCampaigns: Campaign[] = [
    {
        id: 'camp_1',
        title: 'Premium Wireless Noise-Cancelling Headphones',
        asin: 'B08H12345A',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2940&auto=format&fit=crop',
        target: 50,
        claimed: 32,
        region: 'US',
        category: 'Electronics',
        status: 'active',
        guidelines: 'Please provide an honest review focusing on the sound quality, battery life, and comfort after at least 3 days of use. Do not mention that you received a reimbursement for this review.',
        productDescription: 'Experience industry-leading noise cancellation with our latest premium wireless headphones. Features include 30-hour battery life, touch controls, and immersive high-fidelity audio.',
        createdAt: '2026-02-15T10:00:00Z',
        reimbursementPercentage: 100,
    },
    {
        id: 'camp_2',
        title: 'Ergonomic Office Chair with Lumbar Support',
        asin: 'B09XY7890C',
        image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=2940&auto=format&fit=crop',
        target: 20,
        claimed: 5,
        region: 'US',
        category: 'Furniture',
        status: 'paused',
        guidelines: 'We are looking for feedback on assembly difficulty and overall ergonomic comfort. Pictures of the assembled chair in a home office setting are highly appreciated.',
        productDescription: 'An ergonomic office chair designed for long hours of work. Features adjustable armrests, breathless mesh back, and dynamic lumbar support to prevent back pain.',
        createdAt: '2026-02-28T14:30:00Z',
        reimbursementPercentage: 80,
    },
    {
        id: 'camp_3',
        title: 'Organic Vitamin C Serum for Face',
        asin: 'B07KL5432B',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=2787&auto=format&fit=crop',
        target: 100,
        claimed: 100,
        region: 'US',
        category: 'Beauty',
        status: 'completed',
        guidelines: 'Test the serum for at least one week. Focus on how it feels on sensitive skin and its absorption rate. Do not use alongside other strong active ingredients during the test period.',
        productDescription: 'A potent, organic Vitamin C serum designed to brighten skin and reduce the appearance of fine lines. Formulated with Hyaluronic Acid and Vitamin E.',
        createdAt: '2026-01-10T09:15:00Z',
        reimbursementPercentage: 100,
    }
];

export const campaignsApi = {
    getCampaigns: async (): Promise<Campaign[]> => {
        return new Promise((resolve) => setTimeout(() => resolve([...mockCampaigns]), 800));
    },
    getCampaignById: async (id: string): Promise<Campaign | undefined> => {
        return new Promise((resolve) => setTimeout(() => resolve(mockCampaigns.find(c => c.id === id)), 500));
    },
    togglePauseStatus: async (id: string): Promise<Campaign> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
                if (campaignIndex !== -1) {
                    mockCampaigns[campaignIndex].status = mockCampaigns[campaignIndex].status === 'active' ? 'paused' : 'active';
                    resolve({ ...mockCampaigns[campaignIndex] });
                } else {
                    reject(new Error('Campaign not found'));
                }
            }, 500);
        });
    },
    createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newCampaign: Campaign = {
                    ...data,
                    id: Math.random().toString(36).substring(7),
                    status: 'active',
                    claimed: 0,
                    createdAt: new Date().toISOString(),
                } as Campaign;
                mockCampaigns.unshift(newCampaign);
                resolve(newCampaign);
            }, 1500);
        });
    }
};
