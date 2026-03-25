import { fetchWithAuth, buildQueryString } from './httpClient';
import type { PaginatedResponse } from './types';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export interface BillingSummary {
    totalSpent: number;
    totalTransactions: number;
    pendingAmount: number;
    currency: string;
}

export interface BillingTransaction {
    id: string;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    currency: string;
    status: string;
    stripe_transaction_id: string;
    receipt_url: string | null;
    invoice_url: string | null;
    created_at: string;
}

export const billingApi = {
    getSummary: (): Promise<BillingSummary> => {
        return fetchWithAuth('/billing/summary');
    },

    getHistory: (
        page = 1,
        limit = 10,
        search?: string,
        status?: string,
    ): Promise<PaginatedResponse<BillingTransaction>> => {
        const qs = buildQueryString({
            page,
            limit,
            search,
            status: status !== 'ALL' ? status : undefined,
        });
        return fetchWithAuth(`/billing/history${qs}`);
    },

    downloadInvoice: async (transactionId: string): Promise<void> => {
        const token = useAuthStore.getState().tokens?.accessToken;
        const response = await fetch(`${API_BASE_URL}/billing/invoice/${transactionId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Download failed' }));
            throw new Error(err.message);
        }

        // Extract filename from Content-Disposition header or use fallback
        const disposition = response.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
        const filename = filenameMatch?.[1] || `invoice-${transactionId.slice(0, 8)}.pdf`;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },
};
