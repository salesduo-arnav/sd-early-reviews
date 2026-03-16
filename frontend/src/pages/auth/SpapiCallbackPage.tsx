import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Minimal page that the SP-API OAuth popup lands on.
 * Sends the result to the opener via postMessage, then auto-closes.
 */
export default function SpapiCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const spapiStatus = params.get('spapi') || 'error';
        const reason = params.get('reason') || undefined;

        setStatus(spapiStatus === 'success' ? 'success' : 'error');

        if (window.opener) {
            window.opener.postMessage(
                { type: 'spapi_callback', status: spapiStatus, reason },
                window.location.origin
            );
            // Auto-close after a short delay so the user sees the result
            setTimeout(() => window.close(), 1500);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8">
                {status === 'loading' && (
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                        <p className="text-lg font-semibold text-foreground">Amazon account connected!</p>
                        <p className="text-sm text-muted-foreground">This window will close automatically.</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 text-destructive mx-auto" />
                        <p className="text-lg font-semibold text-foreground">Connection failed</p>
                        <p className="text-sm text-muted-foreground">You can close this window and try again.</p>
                    </>
                )}
            </div>
        </div>
    );
}
