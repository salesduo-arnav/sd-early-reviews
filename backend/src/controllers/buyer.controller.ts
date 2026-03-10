import { Request, Response } from 'express';
import { Op, Order } from 'sequelize';
import { OrderClaim, OrderStatus, ReviewStatus, PayoutStatus } from '../models/OrderClaim';
import { Campaign } from '../models/Campaign';
import { BuyerProfile } from '../models/BuyerProfile';
import { SellerProfile } from '../models/SellerProfile';
import { logger } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { startOfDay, endOfDay } from 'date-fns';

// Helpers

// Resolve BuyerProfile.id from JWT userId
const resolveBuyerProfileId = async (userId: string): Promise<string | null> => {
    const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
    return profile ? profile.id : null;
};

// Derive a user-friendly pipeline status from the three internal status fields
function derivePipelineStatus(orderStatus: string, reviewStatus: string, payoutStatus: string): string {
    if (orderStatus === OrderStatus.REJECTED || reviewStatus === ReviewStatus.REJECTED) return 'REJECTED';
    if (reviewStatus === ReviewStatus.TIMEOUT) return 'TIMEOUT';
    if (payoutStatus === PayoutStatus.PROCESSED) return 'REIMBURSED';
    if (reviewStatus === ReviewStatus.APPROVED) return 'APPROVED';
    if (reviewStatus === ReviewStatus.PENDING_VERIFICATION) return 'REVIEW_SUBMITTED';
    if (orderStatus === OrderStatus.APPROVED && reviewStatus === ReviewStatus.AWAITING_UPLOAD) return 'REVIEW_PENDING';
    if (orderStatus === OrderStatus.PENDING_VERIFICATION) return 'ORDER_SUBMITTED';
    return 'ORDER_SUBMITTED';
}

// Build Sequelize where conditions from a pipeline status filter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStatusWhereClause(pipelineStatus: string): Record<string | symbol, any> | null {
    switch (pipelineStatus) {
        case 'ORDER_SUBMITTED':
            return { order_status: OrderStatus.PENDING_VERIFICATION };
        case 'REVIEW_PENDING':
            return { order_status: OrderStatus.APPROVED, review_status: ReviewStatus.AWAITING_UPLOAD };
        case 'REVIEW_SUBMITTED':
            return { review_status: ReviewStatus.PENDING_VERIFICATION };
        case 'APPROVED':
            return { review_status: ReviewStatus.APPROVED, payout_status: { [Op.ne]: PayoutStatus.PROCESSED } };
        case 'REIMBURSED':
            return { payout_status: PayoutStatus.PROCESSED };
        case 'REJECTED':
            return { [Op.or]: [{ order_status: OrderStatus.REJECTED }, { review_status: ReviewStatus.REJECTED }] };
        case 'TIMEOUT':
            return { review_status: ReviewStatus.TIMEOUT };
        default:
            return null;
    }
}

// Format a single claim row with Campaign data for the API response
function formatClaimResponse(claim: OrderClaim): Record<string, unknown> {
    type ClaimWithCampaign = OrderClaim & {
        Campaign?: {
            asin: string;
            product_title: string;
            product_image_url: string;
            region: string;
            guidelines: string | null;
            seller_id: string;
        };
    };
    const c = claim as ClaimWithCampaign;
    return {
        id: c.id,
        campaign_id: c.campaign_id,
        amazon_order_id: c.amazon_order_id,
        purchase_date: c.purchase_date,
        order_status: c.order_status,
        review_status: c.review_status,
        payout_status: c.payout_status,
        pipeline_status: derivePipelineStatus(c.order_status, c.review_status, c.payout_status),
        expected_payout_amount: c.expected_payout_amount,
        review_deadline: c.review_deadline,
        review_proof_url: c.review_proof_url,
        review_rating: c.review_rating,
        review_text: c.review_text,
        amazon_review_id: c.amazon_review_id,
        review_date: c.review_date,
        rejection_reason: c.rejection_reason,
        created_at: c.created_at,
        order_proof_url: c.order_proof_url,
        product_title: c.Campaign?.product_title ?? '',
        product_image_url: c.Campaign?.product_image_url ?? '',
        asin: c.Campaign?.asin ?? '',
        region: c.Campaign?.region ?? 'com',
        guidelines: c.Campaign?.guidelines ?? null,
    };
}

// Controllers

/**
 * GET /api/buyer/claims
 * List the authenticated buyer's claims with pagination and optional status/search filtering.
 */
export const getMyClaims = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const buyerProfileId = await resolveBuyerProfileId(userId);
        if (!buyerProfileId) return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });

        const pagination = parsePaginationParams(req.query, 10);
        const { status, search, startDate, endDate, sort } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: Record<string | symbol, any> = { buyer_id: buyerProfileId };

        // Apply pipeline status filter
        if (status && typeof status === 'string' && status !== 'ALL') {
            const statusWhere = buildStatusWhereClause(status);
            if (statusWhere) {
                Object.assign(whereClause, statusWhere);
            }
        }

        // Apply date range filter
        if (startDate && endDate) {
            whereClause.created_at = {
                [Op.between]: [startOfDay(new Date(startDate as string)), endOfDay(new Date(endDate as string))],
            };
        } else if (startDate) {
            whereClause.created_at = { [Op.gte]: startOfDay(new Date(startDate as string)) };
        } else if (endDate) {
            whereClause.created_at = { [Op.lte]: endOfDay(new Date(endDate as string)) };
        }

        // Apply search filter
        if (search && typeof search === 'string' && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            whereClause[Op.or] = [
                { amazon_order_id: { [Op.iLike]: searchTerm } },
                { '$Campaign.product_title$': { [Op.iLike]: searchTerm } },
                { '$Campaign.asin$': { [Op.iLike]: searchTerm } },
            ];
        }

        // Sorting
        let order: Order = [['created_at', 'DESC']];
        if (sort === 'oldest') {
            order = [['created_at', 'ASC']];
        } else if (sort === 'payout_high') {
            order = [['expected_payout_amount', 'DESC']];
        } else if (sort === 'payout_low') {
            order = [['expected_payout_amount', 'ASC']];
        } else if (sort === 'deadline') {
            order = [['review_deadline', 'ASC NULLS LAST']];
        }

        const { count, rows } = await OrderClaim.findAndCountAll({
            where: whereClause,
            include: [{
                model: Campaign,
                required: true,
                attributes: ['asin', 'product_title', 'product_image_url', 'region', 'guidelines', 'seller_id'],
            }],
            order,
            limit: pagination.limit,
            offset: pagination.offset,
            subQuery: false,
        });

        const claims = rows.map(formatClaimResponse);
        return res.status(200).json(buildPaginatedResponse(claims, count, pagination));
    } catch (error) {
        logger.error(`Error fetching buyer claims: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching claims' });
    }
};

/**
 * GET /api/buyer/claims/:id
 * Get full details for a single claim belonging to the authenticated buyer.
 */
export const getClaimDetail = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const buyerProfileId = await resolveBuyerProfileId(userId);
        if (!buyerProfileId) return res.status(403).json({ message: 'Buyer profile not found' });

        const { id } = req.params;

        const claim = await OrderClaim.findOne({
            where: { id, buyer_id: buyerProfileId },
            include: [{
                model: Campaign,
                required: true,
                attributes: ['asin', 'product_title', 'product_image_url', 'region', 'guidelines', 'seller_id'],
            }],
        });

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        return res.status(200).json(formatClaimResponse(claim));
    } catch (error) {
        logger.error(`Error fetching claim detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching claim details' });
    }
};

/**
 * POST /api/buyer/claims/:id/review
 * Submit review proof for a claim. Validates that the claim is in the correct state.
 */
export const submitReviewProof = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const buyerProfileId = await resolveBuyerProfileId(userId);
        if (!buyerProfileId) return res.status(403).json({ message: 'Buyer profile not found' });

        const { id } = req.params;
        const { review_proof_url, review_rating, review_text, amazon_review_id } = req.body;

        // Validate required fields
        if (!review_proof_url || !review_rating || !review_text) {
            return res.status(400).json({ message: 'review_proof_url, review_rating, and review_text are required' });
        }

        // Validate review_proof_url
        try {
            new URL(review_proof_url);
        } catch {
            return res.status(400).json({ message: 'review_proof_url must be a valid URL' });
        }

        // Validate rating
        const rating = parseInt(review_rating, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'review_rating must be an integer between 1 and 5' });
        }

        // Validate review text
        if (typeof review_text !== 'string' || review_text.trim().length < 10) {
            return res.status(400).json({ message: 'review_text must be at least 10 characters' });
        }

        // Find the claim
        const claim = await OrderClaim.findOne({
            where: { id, buyer_id: buyerProfileId },
            include: [{
                model: Campaign,
                required: true,
                attributes: ['asin', 'product_title', 'product_image_url', 'region', 'guidelines', 'seller_id'],
            }],
        });

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        // Validate claim is in correct state
        if (claim.order_status !== OrderStatus.APPROVED) {
            return res.status(400).json({ message: 'Your order has not been approved yet. Please wait for order verification.' });
        }

        if (claim.review_status !== ReviewStatus.AWAITING_UPLOAD) {
            return res.status(400).json({ message: 'A review has already been submitted for this claim.' });
        }

        // Check deadline
        if (claim.review_deadline && new Date(claim.review_deadline) < new Date()) {
            return res.status(400).json({ message: 'The review submission deadline has passed.' });
        }

        // Update claim with review data
        await claim.update({
            review_proof_url,
            review_rating: rating,
            review_text: review_text.trim(),
            amazon_review_id: amazon_review_id || null,
            review_date: new Date(),
            review_status: ReviewStatus.PENDING_VERIFICATION,
        });

        // Reload to get fresh data with associations
        await claim.reload({
            include: [{
                model: Campaign,
                required: true,
                attributes: ['asin', 'product_title', 'product_image_url', 'region', 'guidelines', 'seller_id'],
            }],
        });

        // Notify the seller (non-blocking)
        type ClaimWithCampaign = OrderClaim & { Campaign?: { seller_id: string; product_title: string } };
        const claimData = claim as ClaimWithCampaign;
        if (claimData.Campaign?.seller_id) {
            const sellerProfile = await SellerProfile.findByPk(claimData.Campaign.seller_id);
            if (sellerProfile) {
                notificationService.send(sellerProfile.user_id, NotificationCategory.REVIEW_SUBMITTED, {
                    message: `A buyer has submitted a review for "${claimData.Campaign.product_title}" (Order: ${claim.amazon_order_id}). Review it in your dashboard.`,
                    actionLink: `/seller/reviews`,
                }).catch((err) => logger.error('Failed to send REVIEW_SUBMITTED notification', { err }));
            }
        }

        return res.status(200).json({
            message: 'Review submitted successfully',
            claim: formatClaimResponse(claim),
        });
    } catch (error) {
        logger.error(`Error submitting review proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while submitting review' });
    }
};

/**
 * DELETE /api/buyer/claims/:id
 * Cancel a claim. Only allowed if the order has not yet been verified.
 */
export const cancelClaim = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const buyerProfileId = await resolveBuyerProfileId(userId);
        if (!buyerProfileId) return res.status(403).json({ message: 'Buyer profile not found' });

        const { id } = req.params;

        const claim = await OrderClaim.findOne({
            where: { id, buyer_id: buyerProfileId },
            include: [{
                model: Campaign,
                required: true,
                attributes: ['product_title', 'seller_id'],
            }],
        });

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        // Only allow cancellation before order is verified
        if (claim.order_status !== OrderStatus.PENDING_VERIFICATION) {
            return res.status(400).json({ message: 'This claim can no longer be cancelled. Only claims pending order verification can be cancelled.' });
        }

        // Soft-delete the claim
        await claim.destroy();

        // Notify the seller (non-blocking)
        type ClaimWithCampaign = OrderClaim & { Campaign?: { seller_id: string; product_title: string } };
        const claimData = claim as ClaimWithCampaign;
        if (claimData.Campaign?.seller_id) {
            const sellerProfile = await SellerProfile.findByPk(claimData.Campaign.seller_id);
            if (sellerProfile) {
                notificationService.send(sellerProfile.user_id, NotificationCategory.NEW_ORDER_CLAIM, {
                    title: 'Claim Cancelled',
                    message: `A buyer has cancelled their claim for "${claimData.Campaign.product_title}" (Order: ${claim.amazon_order_id}).`,
                    actionLink: `/seller/campaigns`,
                }).catch((err) => logger.error('Failed to send claim cancellation notification', { err }));
            }
        }

        return res.status(200).json({ message: 'Claim cancelled successfully' });
    } catch (error) {
        logger.error(`Error cancelling claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while cancelling claim' });
    }
};
