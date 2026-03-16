import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Star, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload } from '@/components/ui/image-upload';
import { buyerApi } from '@/api/buyer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubmitReviewFormProps {
    claimId: string;
    onSuccess: () => void;
}

const reviewSchema = z.object({
    review_rating: z.number().min(1, 'validation.select_rating').max(5),
    review_title: z.string().min(1, 'validation.review_title_required'),
    review_text: z.string().min(10, 'validation.review_min_length'),
    review_proof_url: z.string().min(1, 'validation.screenshot_required'),
    amazon_review_id: z.string().min(1, 'validation.review_url_required'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function SubmitReviewForm({ claimId, onSuccess }: SubmitReviewFormProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [hoveredStar, setHoveredStar] = useState(0);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            review_rating: 0,
            review_title: '',
            review_text: '',
            review_proof_url: '',
            amazon_review_id: '',
        },
    });

    const selectedRating = watch('review_rating');

    const handleFileChange = (file: File | null) => {
        setProofFile(file);
        setValue('review_proof_url', file ? 'pending-upload' : '', { shouldValidate: true });
    };

    const handleStarClick = (rating: number) => {
        setValue('review_rating', rating, { shouldValidate: true });
    };

    const getValidationMessage = (key: string | undefined) => {
        if (!key) return undefined;
        const messages: Record<string, string> = {
            'validation.select_rating': t('buyer.claims.validation.select_rating', 'Please select a rating'),
            'validation.review_title_required': t('buyer.claims.validation.review_title_required', 'Review title is required'),
            'validation.review_min_length': t('buyer.claims.validation.review_min_length', 'Review must be at least 10 characters'),
            'validation.screenshot_required': t('buyer.claims.validation.screenshot_required', 'Review screenshot is required'),
            'validation.review_url_required': t('buyer.claims.validation.review_url_required', 'Amazon Review URL is required for verification'),
        };
        return messages[key] || key;
    };

    const onSubmit = async (data: ReviewFormData) => {
        if (!proofFile) {
            setError(t('buyer.claims.upload_screenshot_error', 'Please upload a review screenshot.'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Upload image to S3
            const { url } = await buyerApi.uploadImage(proofFile);

            await buyerApi.submitReviewProof(claimId, {
                review_proof_url: url,
                review_rating: data.review_rating,
                review_title: data.review_title,
                review_text: data.review_text,
                amazon_review_id: data.amazon_review_id,
            });

            toast.success(t('buyer.claims.review_submitted', 'Review submitted successfully! It will be verified shortly.'));
            onSuccess();
        } catch (err) {
            const message = err instanceof Error ? err.message : t('buyer.claims.review_submit_failed', 'Failed to submit review');
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Star Rating */}
            <div className="space-y-2">
                <Label>{t('buyer.claims.your_rating', 'Your Rating')}</Label>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="p-0.5 transition-transform hover:scale-110"
                        >
                            <Star
                                className={cn(
                                    'w-7 h-7 transition-colors',
                                    (hoveredStar || selectedRating) >= star
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-200 fill-gray-200',
                                )}
                            />
                        </button>
                    ))}
                    {selectedRating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                            {t('buyer.claims.rating_of_5', '{{rating}} of 5', { rating: selectedRating })}
                        </span>
                    )}
                </div>
                {errors.review_rating && (
                    <p className="text-xs text-destructive">{getValidationMessage(errors.review_rating.message)}</p>
                )}
            </div>

            {/* Review Title */}
            <div className="space-y-2">
                <Label htmlFor="review_title">{t('buyer.claims.review_title', 'Review Title')}</Label>
                <Input
                    id="review_title"
                    placeholder={t('buyer.claims.review_title_placeholder', 'Paste the title/headline of your Amazon review...')}
                    {...register('review_title')}
                />
                {errors.review_title && (
                    <p className="text-xs text-destructive">{getValidationMessage(errors.review_title.message)}</p>
                )}
            </div>

            {/* Review Text */}
            <div className="space-y-2">
                <Label htmlFor="review_text">{t('buyer.claims.review_text', 'Review Text')}</Label>
                <Textarea
                    id="review_text"
                    placeholder={t('buyer.claims.review_text_placeholder', 'Paste the full text of your Amazon review here...')}
                    rows={4}
                    {...register('review_text')}
                />
                {errors.review_text && (
                    <p className="text-xs text-destructive">{getValidationMessage(errors.review_text.message)}</p>
                )}
            </div>

            {/* Review Screenshot */}
            <div className="space-y-2">
                <Label>{t('buyer.claims.review_screenshot', 'Review Screenshot')}</Label>
                <ImageUpload
                    file={proofFile}
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                />
                {errors.review_proof_url && (
                    <p className="text-xs text-destructive">{getValidationMessage(errors.review_proof_url.message)}</p>
                )}
            </div>

            {/* Amazon Review URL (required) */}
            <div className="space-y-2">
                <Label htmlFor="amazon_review_id">
                    {t('buyer.claims.amazon_review_url', 'Amazon Review URL')}
                </Label>
                <p className="text-xs text-muted-foreground">
                    {t('buyer.claims.review_url_help', 'Paste the URL of your review from Amazon. This is used to automatically verify your review.')}
                </p>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="amazon_review_id"
                        placeholder="https://www.amazon.com/gp/customer-reviews/..."
                        className="pl-9"
                        {...register('amazon_review_id')}
                    />
                </div>
                {errors.amazon_review_id && (
                    <p className="text-xs text-destructive">{getValidationMessage(errors.amazon_review_id.message)}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !proofFile || selectedRating === 0}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('buyer.claims.submitting_review', 'Submitting Review...')}
                    </>
                ) : (
                    t('buyer.claims.submit_review', 'Submit Review')
                )}
            </Button>
        </form>
    );
}
