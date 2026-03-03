import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/login-otp-request', authController.loginOtpRequest);
router.post('/login-otp-verify', authController.loginOtpVerify);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/google', authController.googleAuth);
router.post('/onboarding', authenticateJWT, authController.onboarding);
router.get('/me', authenticateJWT, authController.me);

export default router;
