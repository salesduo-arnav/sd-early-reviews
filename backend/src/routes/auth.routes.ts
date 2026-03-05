import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/signup', authRateLimiter, authController.signup);
router.post('/login', authRateLimiter, authController.login);
router.post('/login-otp-request', authRateLimiter, authController.loginOtpRequest);
router.post('/login-otp-verify', authRateLimiter, authController.loginOtpVerify);
router.post('/verify-email', authRateLimiter, authController.verifyEmail);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);

router.post('/google', authRateLimiter, authController.googleAuth);
router.post('/onboarding', authenticateJWT, authController.onboarding);
router.get('/me', authenticateJWT, authController.me);

export default router;
