import { Request, Response } from 'express';
import { Op, Order, Sequelize } from 'sequelize';
import { OrderClaim, OrderStatus, ReviewStatus, PayoutStatus } from '../models/OrderClaim';
import { Campaign } from '../models/Campaign';
import { BuyerProfile } from '../models/BuyerProfile';
import { SellerProfile } from '../models/SellerProfile';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { startOfDay, endOfDay } from 'date-fns';
import { attemptAutoReviewVerification } from '../services/verification';

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
        review_title: c.review_title,
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

        const buyerProfile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!buyerProfile) return res.status(403).json({ message: 'Buyer profile not found' });

        if (buyerProfile.is_blacklisted) {
            return res.status(403).json({ message: 'Your account has been restricted. Contact support.' });
        }

        const buyerProfileId = buyerProfile.id;
        const { id } = req.params;
        const { review_proof_url, review_rating, review_title, review_text, amazon_review_id } = req.body;

        // Validate required fields
        if (!review_proof_url || !review_rating || !review_title || !review_text || !amazon_review_id) {
            return res.status(400).json({ message: 'review_proof_url, review_rating, review_title, review_text, and amazon_review_id are required' });
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

        // Validate review title
        if (typeof review_title !== 'string' || review_title.trim().length < 1) {
            return res.status(400).json({ message: 'review_title is required' });
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
            review_title: review_title.trim(),
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

        // Attempt automatic review verification (non-blocking)
        attemptAutoReviewVerification(claim, claim.campaign_id)
            .catch(err => logger.error('Background review auto-verification failed', { claimId: claim.id, err }));

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
            message: 'Review submitted successfully. Pending verification.',
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

// ─── Profile & Earnings ──────────────────────────────────────────────────────

/**
 * GET /api/buyer/profile
 * Return profile data with computed health stats, bank details, and preferences.
 */
export const getAccountProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!profile) return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });

        const user = await User.findByPk(userId, { attributes: ['email'] });

        // Compute claims_completed (payout processed)
        const claimsCompleted = await OrderClaim.count({
            where: { buyer_id: profile.id, payout_status: PayoutStatus.PROCESSED },
        });

        // Compute approval_rate from finalized reviews (approved or rejected)
        const statusCounts = await OrderClaim.findAll({
            where: {
                buyer_id: profile.id,
                review_status: { [Op.in]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED] },
            },
            attributes: ['review_status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['review_status'],
            raw: true,
        }) as unknown as { review_status: string; count: string }[];
        const approvedCount = parseInt(statusCounts.find(r => r.review_status === ReviewStatus.APPROVED)?.count || '0', 10);
        const rejectedCount = parseInt(statusCounts.find(r => r.review_status === ReviewStatus.REJECTED)?.count || '0', 10);
        const totalDecided = approvedCount + rejectedCount;
        const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : null;

        return res.status(200).json({
            id: profile.id,
            email: user?.email ?? '',
            amazon_profile_url: profile.amazon_profile_url,
            on_time_rate: profile.on_time_submission_rate,
            total_earnings: parseFloat(String(profile.total_earnings)),
            claims_completed: claimsCompleted,
            approval_rate: approvalRate,
            wise_connected: !!profile.wise_recipient_id,
            payout_currency: profile.payout_currency || null,
            payout_country: profile.payout_country || null,
            bank_display_label: profile.bank_display_label || null,
            email_notifications_enabled: profile.email_notifications_enabled,
            is_blacklisted: profile.is_blacklisted,
            blacklist_reason: profile.blacklist_reason || null,
        });
    } catch (error) {
        logger.error(`Error fetching account profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while fetching profile' });
    }
};

/**
 * GET /api/buyer/bank-requirements
 * Fetch dynamic bank account field requirements for a given currency via Wise API.
 */
export const getBankRequirements = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { currency } = req.query;
        if (!currency || typeof currency !== 'string' || currency.length !== 3) {
            return res.status(400).json({ message: 'currency query parameter is required (3-letter ISO code)' });
        }

        const { getAccountRequirements } = await import('../services/wise.service');
        const requirements = await getAccountRequirements(currency.toUpperCase());

        return res.status(200).json(requirements);
    } catch (error) {
        logger.error(`Error fetching bank requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Failed to fetch bank account requirements' });
    }
};

/**
 * POST /api/buyer/bank-requirements
 * Refresh requirements after a field with refreshRequirementsOnChange changes.
 */
export const refreshBankRequirements = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { currency } = req.query;
        if (!currency || typeof currency !== 'string' || currency.length !== 3) {
            return res.status(400).json({ message: 'currency query parameter is required (3-letter ISO code)' });
        }

        const formValues = req.body;
        if (!formValues || typeof formValues !== 'object') {
            return res.status(400).json({ message: 'Request body must contain current form values' });
        }

        // Wise POST /v1/account-requirements expects: { type, details: { legalType, abartn, address: { country, ... } } }
        // Our form values are flat: { type: "aba", legalType: "PRIVATE", "address.country": "US", abartn: "..." }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details: Record<string, any> = {};
        let accountType = '';
        for (const [key, value] of Object.entries(formValues as Record<string, string>)) {
            if (!value) continue;
            if (key === 'type') { accountType = value; continue; }

            // Nest dot-notation keys
            const parts = key.split('.');
            if (parts.length === 1) {
                details[key] = value;
            } else {
                let current = details;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            }
        }

        const { refreshAccountRequirements } = await import('../services/wise.service');
        const requirements = await refreshAccountRequirements(
            currency.toUpperCase(),
            { type: accountType || undefined, details },
        );

        return res.status(200).json(requirements);
    } catch (error) {
        logger.error(`Error refreshing bank requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Failed to refresh bank account requirements' });
    }
};

/**
 * PUT /api/buyer/bank-account
 * Connect a bank account via Wise. Creates a Wise recipient from the buyer's bank details.
 */
export const connectBankAccount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!profile) return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });

        const user = await User.findByPk(userId, { attributes: ['full_name'] });

        const { currency, country, type, details } = req.body;

        if (!currency || typeof currency !== 'string') {
            return res.status(400).json({ message: 'currency is required' });
        }
        if (!country || typeof country !== 'string') {
            return res.status(400).json({ message: 'country is required' });
        }
        if (!type || typeof type !== 'string') {
            return res.status(400).json({ message: 'type is required (account type from Wise requirements)' });
        }
        if (!details || typeof details !== 'object') {
            return res.status(400).json({ message: 'details object is required with bank account fields' });
        }

        // If already connected, delete the old Wise recipient first
        if (profile.wise_recipient_id) {
            try {
                const { deleteRecipient } = await import('../services/wise.service');
                await deleteRecipient(profile.wise_recipient_id);
            } catch {
                // Non-fatal: old recipient may already be deleted on Wise's side
            }
        }

        // Convert flat dot-notation keys (e.g. "address.country") into nested objects
        // Wise API expects { address: { country: "IN" } } not { "address.country": "IN" }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedDetails: Record<string, any> = {};
        for (const [key, value] of Object.entries(details as Record<string, string>)) {
            const parts = key.split('.');
            if (parts.length === 1) {
                nestedDetails[key] = value;
            } else {
                let current = nestedDetails;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            }
        }

        const { createRecipient } = await import('../services/wise.service');
        const recipient = await createRecipient({
            accountHolderName: user?.full_name || 'Account Holder',
            currency: currency.toUpperCase(),
            type,
            details: nestedDetails,
            ownedByCustomer: false,
        });

        // Build a display label from the details (masked)
        const detailValues = Object.values(details).filter(v => typeof v === 'string') as string[];
        const lastValue = detailValues[detailValues.length - 1] || '';
        const masked = lastValue.length > 4 ? `****${lastValue.slice(-4)}` : lastValue;
        const displayLabel = `${country.toUpperCase()} ${currency.toUpperCase()} ${masked}`.trim();

        await profile.update({
            wise_recipient_id: String(recipient.id),
            payout_currency: currency.toUpperCase(),
            payout_country: country.toUpperCase(),
            bank_display_label: displayLabel,
        });

        return res.status(200).json({
            wise_connected: true,
            payout_currency: profile.payout_currency,
            payout_country: profile.payout_country,
            bank_display_label: profile.bank_display_label,
        });
    } catch (error) {
        logger.error(`Error connecting bank account: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to connect bank account' });
    }
};

/**
 * DELETE /api/buyer/bank-account
 * Disconnect the connected bank account (deletes Wise recipient).
 */
export const disconnectBankAccount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!profile) return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });

        if (profile.wise_recipient_id) {
            try {
                const { deleteRecipient } = await import('../services/wise.service');
                await deleteRecipient(profile.wise_recipient_id);
            } catch {
                // Non-fatal
            }
        }

        await profile.update({
            wise_recipient_id: null,
            payout_currency: null,
            payout_country: null,
            bank_display_label: null,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`Error disconnecting bank account: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while disconnecting bank account' });
    }
};

/**
 * PATCH /api/buyer/notifications
 * Toggle email notification preference.
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await BuyerProfile.findOne({ where: { user_id: userId } });
        if (!profile) return res.status(403).json({ message: 'Buyer profile not found. Complete onboarding first.' });

        const { email_notifications_enabled } = req.body;

        if (typeof email_notifications_enabled !== 'boolean') {
            return res.status(400).json({ message: 'email_notifications_enabled must be a boolean' });
        }

        await profile.update({ email_notifications_enabled });

        return res.status(200).json({ email_notifications_enabled: profile.email_notifications_enabled });
    } catch (error) {
        logger.error(`Error updating notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error while updating notification preferences' });
    }
};
