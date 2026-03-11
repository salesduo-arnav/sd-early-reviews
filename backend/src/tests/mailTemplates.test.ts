import { buildHtmlTemplate, getSignupOtpEmail, getLoginOtpEmail, getResetPasswordOtpEmail, getNotificationEmail } from '../utils/mailTemplates';

describe('Mail Templates', () => {
    describe('buildHtmlTemplate', () => {
        it('should include the title in the HTML', () => {
            const html = buildHtmlTemplate('Test Title', 'Test message', '123456');
            expect(html).toContain('Test Title');
        });

        it('should include the message in the HTML', () => {
            const html = buildHtmlTemplate('Title', 'This is the message body', '123456');
            expect(html).toContain('This is the message body');
        });

        it('should include the OTP code', () => {
            const html = buildHtmlTemplate('Title', 'Message', '789012');
            expect(html).toContain('789012');
        });

        it('should include SalesDuo branding', () => {
            const html = buildHtmlTemplate('Title', 'Message', '123456');
            expect(html).toContain('SalesDuo');
        });

        it('should include the 10-minute expiry warning', () => {
            const html = buildHtmlTemplate('Title', 'Message', '123456');
            expect(html).toContain('10 minutes');
        });
    });

    describe('getSignupOtpEmail', () => {
        it('should return subject, text, and html', () => {
            const result = getSignupOtpEmail('123456');
            expect(result.subject).toContain('Verify');
            expect(result.text).toContain('123456');
            expect(result.html).toContain('123456');
        });

        it('should include welcome message', () => {
            const result = getSignupOtpEmail('123456');
            expect(result.text).toContain('Welcome');
        });
    });

    describe('getLoginOtpEmail', () => {
        it('should return subject, text, and html', () => {
            const result = getLoginOtpEmail('654321');
            expect(result.subject).toContain('Login');
            expect(result.text).toContain('654321');
            expect(result.html).toContain('654321');
        });
    });

    describe('getResetPasswordOtpEmail', () => {
        it('should return subject, text, and html', () => {
            const result = getResetPasswordOtpEmail('111222');
            expect(result.subject).toContain('Reset');
            expect(result.text).toContain('111222');
            expect(result.html).toContain('111222');
        });
    });

    describe('getNotificationEmail', () => {
        it('should return subject with SalesDuo prefix', () => {
            const result = getNotificationEmail('Order Update', 'Your order has been processed');
            expect(result.subject).toBe('SalesDuo - Order Update');
        });

        it('should include message in text body', () => {
            const result = getNotificationEmail('Title', 'Important message here');
            expect(result.text).toContain('Important message here');
        });

        it('should include title in HTML body', () => {
            const result = getNotificationEmail('Title', 'Message');
            expect(result.html).toContain('Title');
            expect(result.html).toContain('Message');
        });

        it('should handle action link as full URL', () => {
            const result = getNotificationEmail('Title', 'Message', 'https://example.com/page');
            expect(result.text).toContain('https://example.com/page');
            expect(result.html).toContain('https://example.com/page');
        });

        it('should convert relative action link to absolute URL', () => {
            const result = getNotificationEmail('Title', 'Message', '/buyer/orders');
            // Should contain the FRONTEND_URL prefix + the relative path
            expect(result.text).toContain('/buyer/orders');
            expect(result.html).toContain('/buyer/orders');
            expect(result.html).toContain('View Details');
        });

        it('should not include action button when no link provided', () => {
            const result = getNotificationEmail('Title', 'Message');
            expect(result.html).not.toContain('View Details');
        });

        it('should include SalesDuo branding', () => {
            const result = getNotificationEmail('Title', 'Message');
            expect(result.html).toContain('SalesDuo');
        });
    });
});
