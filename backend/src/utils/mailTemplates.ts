// Brand hex colors (derived from the SalesDuo design system HSL values)
const BRAND = {
    primary: '#f59e0b',     // hsl(28, 95%, 53%) — main orange
    primaryDark: '#d97706', // deeper orange for hover-safe contrast
    dark: '#bd5e06',        // hsl(24, 95%, 38%) — burnt orange
    surface: '#fffbf5',     // warm tinted background
    text: '#1c1917',        // stone-900
    textSecondary: '#57534e', // stone-600
    textMuted: '#a8a29e',   // stone-400
    border: '#e7e5e4',      // stone-200
    bgPage: '#f5f5f4',      // stone-100
};

function getBaseUrl(): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

// Table-based layout with inline styles for maximum email client compatibility.
// showUnsubscribe: true for marketing/notification emails, false for transactional (OTP) emails.
function baseLayout(content: string, showUnsubscribe = false): string {
    const unsubscribeLink = `${getBaseUrl()}/buyer/account`;
    const unsubscribeRow = showUnsubscribe ? `
                    <tr>
                        <td style="padding:0 40px 20px 40px;background-color:${BRAND.surface};">
                            <p style="margin:0;font-size:11px;line-height:1.5;color:${BRAND.textMuted};">Don&rsquo;t want these emails? <a href="${unsubscribeLink}" style="color:${BRAND.textMuted};text-decoration:underline;">Manage your notification preferences</a></p>
                        </td>
                    </tr>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SalesDuo</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${BRAND.text};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgPage};padding:48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
                    <!-- Brand bar -->
                    <tr>
                        <td style="height:4px;background:linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%);font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                    <!-- Header -->
                    <tr>
                        <td style="padding:32px 40px 0 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="width:36px;height:36px;background-color:${BRAND.primary};border-radius:8px;text-align:center;vertical-align:middle;">
                                        <span style="font-size:18px;font-weight:700;color:#ffffff;line-height:36px;">S</span>
                                    </td>
                                    <td style="padding-left:12px;">
                                        <span style="font-size:18px;font-weight:700;color:${BRAND.text};letter-spacing:-0.02em;">SalesDuo</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding:28px 40px 40px 40px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 40px ${showUnsubscribe ? '8px' : '24px'} 40px;border-top:1px solid ${BRAND.border};background-color:${BRAND.surface};">
                            <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">&copy; ${new Date().getFullYear()} SalesDuo. All rights reserved.</p>
                        </td>
                    </tr>${unsubscribeRow}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export const buildHtmlTemplate = (title: string, message: string, otp: string) =>
    baseLayout(`
        <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:${BRAND.text};line-height:1.3;">${title}</h1>
        <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:${BRAND.textSecondary};">${message}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            <tr>
                <td style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:6px;padding:16px 32px;">
                    <span style="font-size:28px;font-weight:700;letter-spacing:6px;color:${BRAND.primary};font-variant-numeric:tabular-nums;">${otp}</span>
                </td>
            </tr>
        </table>
        <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.textMuted};">This code expires in 10 minutes. If you didn&rsquo;t request this, you can safely ignore this email.</p>
    `);

const buildNotificationHtmlTemplate = (title: string, message: string, actionLink?: string) =>
    baseLayout(`

        <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:${BRAND.text};line-height:1.3;">${title}</h1>
        <p style="margin:0 0 ${actionLink ? '28px' : '0'};font-size:15px;line-height:1.6;color:${BRAND.textSecondary};">${message}</p>
        ${actionLink ? `
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color:${BRAND.primary};border-radius:6px;">
                    <a href="${actionLink}" style="display:inline-block;padding:10px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">View Details</a>
                </td>
            </tr>
        </table>` : ''}
    `, true);

export const getSignupOtpEmail = (otp: string) => ({
    subject: 'Verify your email — SalesDuo',
    text: `Welcome to SalesDuo! Your email verification code is: ${otp}`,
    html: buildHtmlTemplate('Verify your email', 'Enter the code below to complete your registration.', otp),
});

export const getLoginOtpEmail = (otp: string) => ({
    subject: 'Your sign-in code — SalesDuo',
    text: `Your SalesDuo login code is: ${otp}`,
    html: buildHtmlTemplate('Sign-in code', 'Use the code below to sign in to your account.', otp),
});

export const getResetPasswordOtpEmail = (otp: string) => ({
    subject: 'Reset your password — SalesDuo',
    text: `Your SalesDuo password reset code is: ${otp}`,
    html: buildHtmlTemplate('Reset your password', 'Use the code below to reset your password. If you didn\u2019t request this, no action is needed.', otp),
});

export interface CampaignEmailData {
    productTitle: string;
    productImageUrl: string;
    category: string;
    price: string;
    reimbursementPercent: number;
    reimbursementAmount: string;
    actionLink: string;
    /** Override the email heading (default: "New Campaign Available") */
    heading?: string;
    /** Override the subheading (default: "A product matching your interests is now live on the marketplace.") */
    subheading?: string;
    /** Override the CTA button text (default: "View Campaign") */
    ctaLabel?: string;
}

export const getNewCampaignEmail = (data: CampaignEmailData) => {
    let finalActionLink = data.actionLink;
    if (finalActionLink.startsWith('/')) {
        finalActionLink = `${getBaseUrl()}${finalActionLink}`;
    }

    const heading = data.heading || 'New Campaign Available';
    const subheading = data.subheading || 'A product matching your interests is now live on the marketplace.';
    const ctaLabel = data.ctaLabel || 'View Campaign';

    const html = baseLayout(`
        <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:${BRAND.text};line-height:1.3;">${heading}</h1>
        <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${BRAND.textSecondary};">${subheading}</p>
        <!-- Product card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
            <tr>
                <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="width:120px;vertical-align:top;">
                                <img src="${data.productImageUrl}" alt="${data.productTitle}" width="120" style="display:block;width:120px;height:120px;object-fit:cover;border-right:1px solid ${BRAND.border};" />
                            </td>
                            <td style="vertical-align:top;padding:16px 20px;">
                                <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:${BRAND.text};line-height:1.3;">${data.productTitle}</p>
                                <p style="margin:0 0 12px 0;font-size:12px;color:${BRAND.textMuted};">${data.category}</p>
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding-right:20px;">
                                            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};">Price</p>
                                            <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:${BRAND.text};">${data.price}</p>
                                        </td>
                                        <td style="padding-right:20px;">
                                            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};">Reimburse</p>
                                            <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:${BRAND.primary};">${data.reimbursementPercent}%</p>
                                        </td>
                                        <td>
                                            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.textMuted};">You get</p>
                                            <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:${BRAND.primary};">${data.reimbursementAmount}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color:${BRAND.primary};border-radius:6px;">
                    <a href="${finalActionLink}" style="display:inline-block;padding:10px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">${ctaLabel}</a>
                </td>
            </tr>
        </table>
    `, true);

    return {
        subject: `${heading}: ${data.productTitle} — SalesDuo`,
        text: `${heading}\n\n${data.productTitle} (${data.category})\nPrice: ${data.price} | Reimbursement: ${data.reimbursementPercent}% (${data.reimbursementAmount})\n\nView details: ${finalActionLink}\n\nDon't want these emails? Manage your preferences: ${getBaseUrl()}/buyer/account`,
        html,
    };
};

export const getNotificationEmail = (title: string, message: string, actionLink?: string) => {
    let finalActionLink = actionLink;
    if (finalActionLink && finalActionLink.startsWith('/')) {
        finalActionLink = `${getBaseUrl()}${finalActionLink}`;
    }

    return {
        subject: `${title} — SalesDuo`,
        text: `${title}\n\n${message}${finalActionLink ? `\n\nView details: ${finalActionLink}` : ''}\n\nDon't want these emails? Manage your preferences: ${getBaseUrl()}/buyer/account`,
        html: buildNotificationHtmlTemplate(title, message, finalActionLink),
    };
};
