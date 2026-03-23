import { OrderClaim, ReviewStatus } from '../../models/OrderClaim';
import { PayoutStatus } from '../../models/OrderClaim';
import { Campaign } from '../../models/Campaign';
import { BuyerProfile } from '../../models/BuyerProfile';
import { SystemConfig } from '../../models/SystemConfig';
import { logger } from '../../utils/logger';
import { fetchProfileReviews, ProfileReview } from '../amazon.service';
import { extractReviewId, computeTextSimilarity } from '../../utils/reviewVerification';
import { notificationService } from '../notification.service';
import { NotificationCategory } from '../../models/Notification';
import { mockFetchProfileReviews } from './review-verification.mock';

export interface ReviewVerificationResult {
    autoVerified: boolean;
    method: string;
    matchedReviewId?: string;
    confidence?: number;
    reason?: string;
}

interface ConfidenceBreakdown {
    reviewFoundOnProfile: number;
    productTitleMatch: number;
    reviewTitleSimilarity: number;
    reviewTextSimilarity: number;
    ratingMatch: number;
    profileOwnership: number;
    total: number;
    details: Record<string, unknown>;
}

/**
 * Attempt automatic review verification by scraping the buyer's Amazon profile.
 *
 * Flow:
 * 1. Fetch all reviews from the buyer's Amazon profile page
 * 2. Search for the submitted review URL in the profile's review list
 * 3. Score multiple signals: URL match, product title, text similarity, rating
 * 4. Auto-approve if confidence >= 65, otherwise fall back to manual
 *
 * This function NEVER throws. It always returns a result.
 */
export async function attemptAutoReviewVerification(
    claim: OrderClaim,
    campaignId: string
): Promise<ReviewVerificationResult> {
    try {
        // 1. Check if auto-verification is enabled
        const config = await SystemConfig.findByPk('auto_review_verification_enabled');
        if (!config || config.value !== 'true') {
            return { autoVerified: false, method: 'MANUAL' };
        }

        // 2. Load campaign and buyer profile
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) {
            logger.warn('Review auto-verification: campaign not found', { campaignId });
            return { autoVerified: false, method: 'MANUAL' };
        }

        const buyerProfile = await BuyerProfile.findByPk(claim.buyer_id);
        if (!buyerProfile || !buyerProfile.amazon_profile_url) {
            logger.warn('Review auto-verification: buyer profile or amazon_profile_url not found', { buyerId: claim.buyer_id });
            return { autoVerified: false, method: 'MANUAL' };
        }

        // 3. Extract review ID from the submitted amazon_review_id
        const submittedReviewId = extractReviewId(claim.amazon_review_id);
        if (!submittedReviewId) {
            logger.warn('Review auto-verification: could not extract review ID', {
                claimId: claim.id,
                amazonReviewId: claim.amazon_review_id,
            });
            await claim.update({
                review_verification_details: { reason: 'INVALID_REVIEW_ID', amazonReviewId: claim.amazon_review_id },
            });
            return { autoVerified: false, method: 'MANUAL', reason: 'INVALID_REVIEW_ID' };
        }

        // 4. Fetch reviews from buyer's Amazon profile
        const isMockMode = process.env.REVIEW_VERIFICATION_MOCK_MODE === 'true';

        let profileReviews: ProfileReview[];

        if (isMockMode) {
            const mockResult = mockFetchProfileReviews(submittedReviewId, campaign.asin, campaign.product_title);
            profileReviews = mockResult.reviews;
        } else {
            const result = await fetchProfileReviews(buyerProfile.amazon_profile_url);
            if (!result) {
                await claim.update({
                    review_verification_details: { reason: 'PROFILE_FETCH_FAILED', profileUrl: buyerProfile.amazon_profile_url },
                });
                return { autoVerified: false, method: 'MANUAL', reason: 'PROFILE_FETCH_FAILED' };
            }
            profileReviews = result.reviews;
        }

        if (profileReviews.length === 0) {
            await claim.update({
                review_verification_details: { reason: 'NO_REVIEWS_ON_PROFILE', profileUrl: buyerProfile.amazon_profile_url },
            });
            return { autoVerified: false, method: 'MANUAL', reason: 'NO_REVIEWS_ON_PROFILE' };
        }

        // 5. Find the submitted review in the profile's review list
        const matchedReview = findMatchingReview(profileReviews, submittedReviewId);

        if (!matchedReview) {
            await claim.update({
                review_verification_details: {
                    reason: 'REVIEW_NOT_FOUND_ON_PROFILE',
                    submittedReviewId,
                    profileReviewCount: profileReviews.length,
                    profileReviewIds: profileReviews.map(r => extractReviewId(r.viewOnAmazon)).filter(Boolean),
                },
            });
            return { autoVerified: false, method: 'MANUAL', reason: 'REVIEW_NOT_FOUND_ON_PROFILE' };
        }

        // 6. Calculate confidence score
        const confidence = calculateConfidence(matchedReview, claim, campaign);

        // 7. Store verification details
        await claim.update({
            review_verification_details: {
                confidence,
                matchedReview: {
                    title: matchedReview.title,
                    description: matchedReview.description,
                    asinTitle: matchedReview.asinTitle,
                    rating: matchedReview.rating,
                    viewOnAmazon: matchedReview.viewOnAmazon,
                },
                submittedReviewId,
                profileUrl: buyerProfile.amazon_profile_url,
                profileReviewCount: profileReviews.length,
                _mock: isMockMode || undefined,
            },
        });

        // 8. Auto-approve if confidence meets threshold
        if (confidence.total >= 85) {
            const approvedAt = new Date();
            await claim.update({
                review_status: ReviewStatus.APPROVED,
                payout_status: PayoutStatus.PENDING,
                review_verification_method: 'AUTO_PROFILE_SCRAPE',
                review_auto_verified_at: approvedAt,
                review_approved_at: approvedAt,
            });

            // Notify buyer
            notificationService.send(buyerProfile.user_id, NotificationCategory.REVIEW_APPROVED, {
                message: `Your review for "${campaign.product_title}" has been automatically verified and approved. Your payout is now pending.`,
            }).catch(err => logger.error('Failed to send auto review verification notification', { err }));

            logger.info('Review auto-verified via profile scrape', {
                claimId: claim.id,
                reviewId: submittedReviewId,
                confidence: confidence.total,
                campaignId,
            });

            return {
                autoVerified: true,
                method: 'AUTO_PROFILE_SCRAPE',
                matchedReviewId: submittedReviewId,
                confidence: confidence.total,
            };
        }

        // Verification did not meet threshold
        logger.info('Review auto-verification: confidence below threshold', {
            claimId: claim.id,
            reviewId: submittedReviewId,
            confidence: confidence.total,
            breakdown: confidence.details,
        });

        return {
            autoVerified: false,
            method: 'MANUAL',
            confidence: confidence.total,
            reason: 'CONFIDENCE_BELOW_THRESHOLD',
        };

    } catch (error) {
        // Graceful fallback: any exception means manual review
        logger.warn('Review auto-verification encountered an error, falling back to manual', {
            claimId: claim.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return { autoVerified: false, method: 'MANUAL' };
    }
}

/**
 * Find a matching review in the profile's review list by review ID.
 */
function findMatchingReview(reviews: ProfileReview[], submittedReviewId: string): ProfileReview | null {
    for (const review of reviews) {
        const profileReviewId = extractReviewId(review.viewOnAmazon);
        if (profileReviewId && profileReviewId.toUpperCase() === submittedReviewId.toUpperCase()) {
            return review;
        }
    }
    return null;
}

/**
 * Calculate confidence score based on multiple signals.
 *
 * | Signal                                        | Points |
 * |-----------------------------------------------|--------|
 * | Review URL found on buyer's profile           | +40    |
 * | Profile ownership (on their profile = theirs) | +15    |
 * | Product title matches campaign product        | +20    |
 * | Review title similarity >= 70%                | +5     |
 * | Review text similarity >= 70%                 | +10    |
 * | Rating matches submitted rating               | +10    |
 * | Total                                         | 100    |
 */
function calculateConfidence(
    matchedReview: ProfileReview,
    claim: OrderClaim,
    campaign: Campaign,
): ConfidenceBreakdown {
    const details: Record<string, unknown> = {};

    // Review URL found on buyer's profile (+40)
    const reviewFoundOnProfile = 40;
    details.reviewFoundOnProfile = true;

    // Profile ownership (+15) — review on their profile = they wrote it
    const profileOwnership = 15;
    details.profileOwnership = true;

    // Product title match (+20)
    let productTitleMatch = 0;
    if (matchedReview.asinTitle && campaign.product_title) {
        const similarity = computeTextSimilarity(matchedReview.asinTitle, campaign.product_title);
        productTitleMatch = similarity >= 0.5 ? 20 : 0;
        details.productTitleMatch = {
            match: productTitleMatch > 0,
            similarity: Math.round(similarity * 100) / 100,
            profileTitle: matchedReview.asinTitle,
            campaignTitle: campaign.product_title,
        };
    }

    // Review title similarity (+5)
    let reviewTitleSimilarity = 0;
    if (matchedReview.title && claim.review_title) {
        const similarity = computeTextSimilarity(matchedReview.title, claim.review_title);
        reviewTitleSimilarity = similarity >= 0.7 ? 5 : 0;
        details.reviewTitleSimilarity = {
            match: reviewTitleSimilarity > 0,
            score: Math.round(similarity * 100) / 100,
            threshold: 0.7,
            profileTitle: matchedReview.title,
            submittedTitle: claim.review_title,
        };
    }

    // Review text similarity (+10)
    let reviewTextSimilarity = 0;
    if (matchedReview.description && claim.review_text) {
        const similarity = computeTextSimilarity(matchedReview.description, claim.review_text);
        reviewTextSimilarity = similarity >= 0.7 ? 10 : 0;
        details.reviewTextSimilarity = {
            match: reviewTextSimilarity > 0,
            score: Math.round(similarity * 100) / 100,
            threshold: 0.7,
        };
    }

    // Rating match (+10)
    let ratingMatch = 0;
    if (matchedReview.rating != null && claim.review_rating != null) {
        const match = matchedReview.rating === claim.review_rating;
        ratingMatch = match ? 10 : 0;
        details.ratingMatch = { match, profileRating: matchedReview.rating, submittedRating: claim.review_rating };
    }

    const total = reviewFoundOnProfile + profileOwnership + productTitleMatch + reviewTitleSimilarity + reviewTextSimilarity + ratingMatch;

    return { reviewFoundOnProfile, profileOwnership, productTitleMatch, reviewTitleSimilarity, reviewTextSimilarity, ratingMatch, total, details };
}
