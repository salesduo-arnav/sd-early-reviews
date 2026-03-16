import { ProfileReview, ProfileReviewsResult } from '../amazon.service';

/**
 * Mock profile review fetching for local development and CI.
 *
 * - Review IDs starting with 'R1': returns a profile with the matching review (success case)
 * - Review IDs starting with 'R0': returns a profile with reviews but NOT the submitted one (mismatch case)
 * - Any other review ID: returns empty reviews (no reviews on profile)
 */
export function mockFetchProfileReviews(
    submittedReviewId: string,
    expectedAsin: string,
    campaignProductTitle: string,
): ProfileReviewsResult {
    if (submittedReviewId.startsWith('R1')) {
        // Success: the submitted review exists on the profile
        const reviews: ProfileReview[] = [
            {
                title: 'Great product',
                description: 'This is a mock review for testing. The product works great and I am very satisfied with the purchase.',
                asinTitle: campaignProductTitle,
                rating: 5,
                viewOnAmazon: `https://amazon.com/gp/customer-reviews/${submittedReviewId}?ref=pf_vv_at_pdctrvw_srp`,
                productImageUrl: 'https://example.com/product.jpg',
            },
            {
                title: 'Another review',
                description: 'Some other product review on the profile.',
                asinTitle: 'Some Other Product',
                rating: 4,
                viewOnAmazon: 'https://amazon.com/gp/customer-reviews/ROTHER123456?ref=pf_vv_at_pdctrvw_srp',
                productImageUrl: 'https://example.com/other.jpg',
            },
        ];
        return { reviews, nextPageToken: '' };
    }

    if (submittedReviewId.startsWith('R0')) {
        // Mismatch: profile has reviews but not the submitted one
        const reviews: ProfileReview[] = [
            {
                title: 'Different review',
                description: 'This review is for a different product.',
                asinTitle: 'Completely Different Product',
                rating: 3,
                viewOnAmazon: 'https://amazon.com/gp/customer-reviews/RDIFFERENT789?ref=pf_vv_at_pdctrvw_srp',
                productImageUrl: 'https://example.com/diff.jpg',
            },
        ];
        return { reviews, nextPageToken: '' };
    }

    // Default: no reviews on profile
    return { reviews: [], nextPageToken: '' };
}
