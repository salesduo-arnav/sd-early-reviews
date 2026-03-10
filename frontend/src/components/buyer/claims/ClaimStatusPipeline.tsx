import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClaimStatusPipelineProps {
    pipelineStatus: string;
}

const STATUS_ORDER: Record<string, number> = {
    ORDER_SUBMITTED: 0,
    REVIEW_PENDING: 1,
    REVIEW_SUBMITTED: 2,
    APPROVED: 3,
    REIMBURSED: 4,
};

export function ClaimStatusPipeline({ pipelineStatus }: ClaimStatusPipelineProps) {
    const { t } = useTranslation();
    const isTerminal = pipelineStatus === 'REJECTED' || pipelineStatus === 'TIMEOUT';
    const currentIndex = STATUS_ORDER[pipelineStatus] ?? -1;

    const STEPS = [
        { key: 'ORDER_SUBMITTED', label: t('buyer.claims.step.order_submitted', 'Order Submitted') },
        { key: 'REVIEW_PENDING', label: t('buyer.claims.step.review_pending', 'Review Pending') },
        { key: 'REVIEW_SUBMITTED', label: t('buyer.claims.step.review_submitted', 'Review Submitted') },
        { key: 'APPROVED', label: t('buyer.claims.step.approved', 'Approved') },
        { key: 'REIMBURSED', label: t('buyer.claims.step.reimbursed', 'Reimbursed') },
    ];

    const failedIndex = isTerminal
        ? (pipelineStatus === 'TIMEOUT' ? 1 : currentIndex >= 0 ? currentIndex : 0)
        : -1;

    const isFullyComplete = pipelineStatus === 'REIMBURSED';

    const getStepState = (stepIndex: number) => {
        if (isTerminal) {
            if (stepIndex < failedIndex) return 'completed';
            if (stepIndex === failedIndex) return 'failed';
            return 'future';
        }
        if (isFullyComplete) return 'completed';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'future';
    };

    const getLineState = (stepIndex: number) => {
        if (isTerminal) {
            return stepIndex < failedIndex ? 'completed' : 'future';
        }
        if (isFullyComplete) return 'completed';
        return stepIndex < currentIndex ? 'completed' : 'future';
    };

    const getFailedLabel = () => {
        return pipelineStatus === 'TIMEOUT'
            ? t('buyer.claims.status.timed_out', 'Timed Out')
            : t('buyer.claims.status.rejected', 'Rejected');
    };

    return (
        <>
            {/* Desktop: full horizontal stepper with separated rows for alignment */}
            <div className="hidden sm:block w-full">
                {/* Circles + Lines row */}
                <div className="flex items-center w-full">
                    {STEPS.map((step, index) => {
                        const state = getStepState(index);
                        return (
                            <React.Fragment key={step.key}>
                                {/* Circle */}
                                <div
                                    className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0',
                                        state === 'completed' && 'bg-green-500 border-green-500 text-white',
                                        state === 'current' && 'bg-brand-primary border-brand-primary text-white ring-4 ring-brand-primary/20',
                                        state === 'failed' && 'bg-destructive border-destructive text-white',
                                        state === 'future' && 'bg-muted border-muted-foreground/20 text-muted-foreground/40',
                                    )}
                                >
                                    {state === 'completed' ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : state === 'failed' ? (
                                        <X className="w-3.5 h-3.5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                {/* Connecting line */}
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            'flex-1 h-0.5 mx-1.5 rounded-full transition-all',
                                            getLineState(index) === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/15',
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                {/* Labels row */}
                <div className="flex w-full mt-2">
                    {STEPS.map((step, index) => {
                        const state = getStepState(index);
                        const label = state === 'failed' ? getFailedLabel() : step.label;
                        return (
                            <React.Fragment key={step.key}>
                                <span
                                    className={cn(
                                        'text-[10px] text-center leading-tight flex-shrink-0 w-7',
                                        state === 'completed' && 'text-green-600 font-medium',
                                        state === 'current' && 'text-brand-primary font-semibold',
                                        state === 'failed' && 'text-destructive font-semibold',
                                        state === 'future' && 'text-muted-foreground',
                                    )}
                                    style={{ width: '56px', marginLeft: index === 0 ? '-14px' : '0', marginRight: index === STEPS.length - 1 ? '-14px' : '0' }}
                                >
                                    {label}
                                </span>
                                {index < STEPS.length - 1 && <div className="flex-1" />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Mobile: condensed view */}
            <div className="flex sm:hidden items-center gap-2">
                <div className="flex items-center gap-1">
                    {STEPS.map((step, index) => {
                        const state = getStepState(index);
                        return (
                            <div
                                key={step.key}
                                className={cn(
                                    'rounded-full transition-all',
                                    state === 'completed' && 'w-2 h-2 bg-green-500',
                                    state === 'current' && 'w-3 h-3 bg-brand-primary',
                                    state === 'failed' && 'w-3 h-3 bg-destructive',
                                    state === 'future' && 'w-2 h-2 bg-muted-foreground/20',
                                )}
                            />
                        );
                    })}
                </div>
                <span className={cn(
                    'text-xs font-medium',
                    isTerminal ? 'text-destructive' : 'text-foreground',
                )}>
                    {isTerminal
                        ? getFailedLabel()
                        : STEPS.find(s => s.key === pipelineStatus)?.label ?? pipelineStatus
                    }
                </span>
            </div>
        </>
    );
}
