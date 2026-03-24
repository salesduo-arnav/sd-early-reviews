// Shared email layout — single source for HTML structure and styles
function baseLayout(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #111827; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #ff9900; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px 32px; text-align: center; }
        .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .message { font-size: 16px; line-height: 1.5; color: #4b5563; margin-bottom: 32px; }
        .otp-container { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #ff9900; margin: 0; }
        .cta-button { display: inline-block; background-color: #ff9900; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .warning { font-size: 12px; color: #9ca3af; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>SalesDuo</h1></div>
        <div class="content">${content}</div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} SalesDuo. All rights reserved.</p></div>
    </div>
</body>
</html>`;
}

export const buildHtmlTemplate = (title: string, message: string, otp: string) =>
    baseLayout(`
        <div class="title">${title}</div>
        <div class="message">${message}</div>
        <div class="otp-container"><p class="otp-code">${otp}</p></div>
        <p class="warning">This code will expire in 10 minutes. Please do not share this code with anyone.</p>
    `);

const buildNotificationHtmlTemplate = (title: string, message: string, actionLink?: string) =>
    baseLayout(`
        <div class="title">${title}</div>
        <div class="message">${message}</div>
        ${actionLink ? `<a href="${actionLink}" class="cta-button">View Details</a>` : ''}
    `);

export const getSignupOtpEmail = (otp: string) => ({
    subject: 'SalesDuo - Verify your email',
    text: `Welcome to SalesDuo! Your email verification code is: ${otp}`,
    html: buildHtmlTemplate('Welcome to SalesDuo!', 'To complete your signup, please use the following verification code:', otp),
});

export const getLoginOtpEmail = (otp: string) => ({
    subject: 'SalesDuo - Login Code',
    text: `Your SalesDuo login code is: ${otp}`,
    html: buildHtmlTemplate('Sign In Request', 'You requested to sign in to your SalesDuo account. Please use the following code:', otp),
});

export const getResetPasswordOtpEmail = (otp: string) => ({
    subject: 'SalesDuo - Reset Your Password',
    text: `Your SalesDuo password reset code is: ${otp}`,
    html: buildHtmlTemplate('Password Reset Request', 'We received a request to reset your password. Please use the following code to proceed:', otp),
});

export const getNotificationEmail = (title: string, message: string, actionLink?: string) => {
    let finalActionLink = actionLink;
    if (finalActionLink && finalActionLink.startsWith('/')) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        finalActionLink = `${cleanBaseUrl}${finalActionLink}`;
    }

    return {
        subject: `SalesDuo - ${title}`,
        text: `${title}\n\n${message}${finalActionLink ? `\n\nView details: ${finalActionLink}` : ''}`,
        html: buildNotificationHtmlTemplate(title, message, finalActionLink),
    };
};
