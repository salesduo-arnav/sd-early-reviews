import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { startOfDay, endOfDay } from 'date-fns';

const resolveSellerProfile = async (userId: string) => {
    const profile = await SellerProfile.findOne({ where: { user_id: userId } });
    return profile ?? null;
};

export const getBillingSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await resolveSellerProfile(userId);
        if (!profile) return res.status(403).json({ message: 'Seller profile not found' });

        const baseWhere = { user_id: userId, type: TransactionType.SELLER_CHARGE };

        const [totalSpent, totalTransactions, pendingAmount] = await Promise.all([
            Transaction.sum('gross_amount', {
                where: { ...baseWhere, status: TransactionStatus.SUCCESS },
            }),
            Transaction.count({ where: baseWhere }),
            Transaction.sum('gross_amount', {
                where: { ...baseWhere, status: TransactionStatus.PENDING },
            }),
        ]);

        return res.status(200).json({
            totalSpent: parseFloat((totalSpent || 0).toString()),
            totalTransactions,
            pendingAmount: parseFloat((pendingAmount || 0).toString()),
        });
    } catch (error) {
        logger.error(`Error fetching billing summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getBillingHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await resolveSellerProfile(userId);
        if (!profile) return res.status(403).json({ message: 'Seller profile not found' });

        const paginationParams = parsePaginationParams(req.query, 10);
        const { search, status, startDate, endDate } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = {
            user_id: userId,
            type: TransactionType.SELLER_CHARGE,
        };

        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        if (startDate && endDate) {
            whereClause.created_at = {
                [Op.between]: [startOfDay(new Date(startDate as string)), endOfDay(new Date(endDate as string))],
            };
        } else if (startDate) {
            whereClause.created_at = { [Op.gte]: startOfDay(new Date(startDate as string)) };
        } else if (endDate) {
            whereClause.created_at = { [Op.lte]: endOfDay(new Date(endDate as string)) };
        }

        if (search) {
            whereClause[Op.or] = [
                { stripe_transaction_id: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: paginationParams.limit,
            offset: paginationParams.offset,
        });

        const formattedRows = rows.map((t) => ({
            id: t.id,
            gross_amount: parseFloat(t.gross_amount.toString()),
            platform_fee: parseFloat(t.platform_fee.toString()),
            net_amount: parseFloat(t.net_amount.toString()),
            status: t.status,
            stripe_transaction_id: t.stripe_transaction_id,
            receipt_url: t.receipt_url || null,
            invoice_url: t.invoice_url || null,
            created_at: t.created_at,
        }));

        return res.status(200).json(buildPaginatedResponse(formattedRows, count, paginationParams));
    } catch (error) {
        logger.error(`Error fetching billing history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const downloadInvoice = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { transactionId } = req.params;
        const transaction = await Transaction.findOne({
            where: { id: transactionId, user_id: userId },
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Prefer invoice PDF, fall back to receipt
        const pdfUrl = transaction.invoice_url || transaction.receipt_url;
        if (!pdfUrl) {
            return res.status(404).json({ message: 'No invoice available for this transaction' });
        }

        // Fetch the PDF from Stripe and stream it to the client
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok || !pdfResponse.body) {
            return res.status(502).json({ message: 'Failed to fetch invoice from payment provider' });
        }

        const dateStr = transaction.created_at.toISOString().slice(0, 10);
        const filename = `invoice-${dateStr}-${transactionId.slice(0, 8)}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the readable stream from fetch to the Express response
        const reader = pdfResponse.body.getReader();
        const pump = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) { res.end(); return; }
            res.write(value);
            return pump();
        };
        await pump();
    } catch (error) {
        logger.error(`Error downloading invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};
