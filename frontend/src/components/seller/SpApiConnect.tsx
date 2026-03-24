import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { spapiApi, SpapiStatus } from '@/api/seller';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { LinkIcon, ShieldCheck, ShieldX, Loader2, ExternalLink } from 'lucide-react';

interface SpApiConnectProps {
    compact?: boolean;
    onStatusChange?: (authorized: boolean) => void;
}

const SpApiConnect: React.FC<SpApiConnectProps> = ({ compact = false, onStatusChange }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<SpapiStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await spapiApi.getStatus();
            setStatus(data);
            onStatusChange?.(data.authorized);
        } catch {
            setStatus(null);
            onStatusChange?.(false);
        } finally {
            setLoading(false);
        }
    }, [onStatusChange]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Listen for postMessage from the OAuth popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'spapi_callback') return;

            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }

            if (event.data.status === 'success') {
                toast.success(t('spapi.oauth_success', 'Amazon Seller account connected successfully!'));
            } else {
                toast.error(t('spapi.oauth_error', `Failed to connect: ${event.data.reason || 'unknown error'}`));
            }

            setActionLoading(false);
            fetchStatus();
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [fetchStatus, t]);

    const handleConnect = async () => {
        try {
            setActionLoading(true);
            const { authUrl } = await spapiApi.getAuthUrl();

            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                authUrl,
                'spapi_auth',
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            // Poll for popup close (user might close without completing)
            pollTimerRef.current = setInterval(() => {
                if (popup?.closed) {
                    if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                    }
                    setActionLoading(false);
                    fetchStatus();
                }
            }, 500);
        } catch (error) {
            toast.error(getErrorMessage(error));
            setActionLoading(false);
        }
    };

    const handleRevoke = async () => {
        try {
            setActionLoading(true);
            await spapiApi.revoke();
            toast.success(t('spapi.revoked', 'Amazon SP-API authorization revoked'));
            await fetchStatus();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setActionLoading(false);
        }
    };

    const isAuthorized = status?.authorized === true;

    if (loading) {
        if (compact) {
            return (
                <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            );
        }
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (compact) {
        return (
            <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {isAuthorized ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                                <ShieldCheck className="h-4 w-4 text-green-700" />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none">
                                {t('spapi.title', 'Amazon Seller Integration')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isAuthorized
                                    ? t('spapi.connected_desc', 'Automatic order verification is active')
                                    : t('spapi.description_short', 'Connect to enable automatic order verification')}
                            </p>
                        </div>
                    </div>
                    {isAuthorized ? (
                        <Badge variant="default" className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                            {t('spapi.connected', 'Connected')}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="shrink-0">
                            {t('spapi.optional', 'Optional')}
                        </Badge>
                    )}
                </div>
                {!isAuthorized && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleConnect}
                        disabled={actionLoading}
                        className="w-full"
                    >
                        {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        )}
                        {actionLoading
                            ? t('spapi.connecting', 'Connecting...')
                            : t('spapi.connect_btn', 'Connect Amazon Account')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2.5 text-lg">
                            {isAuthorized ? (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                                    <ShieldCheck className="h-5 w-5 text-green-700" />
                                </div>
                            ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            {t('spapi.card_title', 'Amazon Seller Integration')}
                        </CardTitle>
                        <CardDescription className="max-w-lg">
                            {t('spapi.card_description', 'Connect your Amazon Seller Central account to enable automatic order verification. When connected, buyer orders are verified instantly against your Amazon orders.')}
                        </CardDescription>
                    </div>
                    {isAuthorized ? (
                        <Badge variant="default" className="shrink-0 self-start bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                            {t('spapi.connected', 'Connected')}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="shrink-0 self-start">
                            {t('spapi.not_connected', 'Not Connected')}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAuthorized ? (
                    <>
                        <div className="rounded-lg bg-muted/50 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                        {t('spapi.seller_id', 'Selling Partner ID')}
                                    </span>
                                    <p className="font-mono text-sm mt-1 break-all">{status?.sellingPartnerId}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                        {t('spapi.authorized_at', 'Connected Since')}
                                    </span>
                                    <p className="text-sm mt-1">
                                        {status?.authorizedAt
                                            ? new Date(status.authorizedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRevoke}
                            disabled={actionLoading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldX className="h-4 w-4 mr-2" />}
                            {t('spapi.disconnect_btn', 'Disconnect')}
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-dashed p-4 bg-muted/30">
                        <p className="text-sm text-muted-foreground flex-1">
                            {t('spapi.connect_help', 'Clicking the button will open Amazon Seller Central in a popup where you can authorize our application. This is a one-time setup.')}
                        </p>
                        <Button onClick={handleConnect} disabled={actionLoading} className="shrink-0 w-full sm:w-auto">
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ExternalLink className="h-4 w-4 mr-2" />
                            )}
                            {actionLoading
                                ? t('spapi.connecting', 'Connecting...')
                                : t('spapi.connect_btn', 'Connect Amazon Account')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SpApiConnect;
