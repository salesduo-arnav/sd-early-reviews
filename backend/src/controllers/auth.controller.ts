import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import BuyerProfile from '../models/BuyerProfile';
import SellerProfile from '../models/SellerProfile';
import { OAuth2Client } from 'google-auth-library';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp';
import { generateAccessToken, generateRefreshToken, generateOtpToken, verifyToken, OtpTokenPayload } from '../utils/jwt';
import { mailService } from '../services/mail.service';
import { getSignupOtpEmail, getLoginOtpEmail, getResetPasswordOtpEmail } from '../utils/mailTemplates';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '../models/Notification';
import { isAdminEmail } from '../utils/adminEmails';
import { hasUserProfile } from '../utils/profileCheck';

async function buildAuthResponse(user: User) {
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
    const has_profile = await hasUserProfile(user.id, user.role);
    return {
        tokens: { accessToken, refreshToken },
        user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified, has_profile },
    };
}

// SIGNUP
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, role, amazon_profile_url, region, company_name } = req.body;

        // Validation
        if (!email || !password || !full_name || !role) {
            res.status(400).json({ message: 'Missing required standard user fields' });
            return;
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: 'Email already in use' });
            return;
        }

        // Roles specific validation
        if (role === 'BUYER') {
            if (!amazon_profile_url) {
                res.status(400).json({ message: 'Missing amazon_profile_url for BUYER' });
                return;
            }
            if (!region) {
                res.status(400).json({ message: 'Missing region for BUYER' });
                return;
            }
        }

        // Admin Interception
        const isEmailAdmin = isAdminEmail(email);

        const userRole = isEmailAdmin ? UserRole.ADMIN : (role === 'BUYER' ? UserRole.BUYER : UserRole.SELLER);
        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password_hash,
            full_name,
            role: userRole,
            is_verified: false,
        });

        if (userRole === UserRole.BUYER) {
            await BuyerProfile.create({
                user_id: newUser.id,
                amazon_profile_url,
                region,
            });
        } else if (userRole === UserRole.SELLER) {
            // For Seller
            await SellerProfile.create({
                user_id: newUser.id,
                company_name,
                stripe_customer_id: '',
            });
        }
        // If ADMIN, we intentionally skip creating a BuyerProfile or SellerProfile

        // Send welcome notification (async, non-blocking)
        notificationService.send(newUser.id, NotificationCategory.WELCOME, {
            message: `Hi ${full_name}! Welcome to SalesDuo. We're excited to have you on board. Explore your dashboard to get started.`,
        }).catch(err => {
            logger.error('Failed to send welcome notification', { error: err });
        });

        // Generate OTP for email verification
        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpToken = generateOtpToken({ email, otpHash });

        // Send Email asynchronously (don't block the response)
        const emailTemplate = getSignupOtpEmail(otp);
        mailService.sendMail({
            to: email,
            ...emailTemplate
        }).catch(err => {
            logger.error('Failed to send async signup OTP email', { error: err });
        });

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            otpToken, // Send token back for the client to attach in the next request
        });
    } catch (error) {
        logger.error('Signup error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { otp, otpToken } = req.body;
        if (!otp || !otpToken) {
            res.status(400).json({ message: 'Missing otp or otpToken' });
            return;
        }

        const payload = verifyToken<OtpTokenPayload>(otpToken);
        const isValid = await verifyOtpHash(otp, payload.otpHash);

        if (!isValid) {
            res.status(401).json({ message: 'Invalid OTP' });
            return;
        }

        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.is_verified = true;
        await user.save();

        const authResponse = await buildAuthResponse(user);

        res.status(200).json({
            message: 'Email verified successfully',
            ...authResponse,
        });
    } catch (error) {
        logger.error('Verify Email error', { error });
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// LOGIN PASSWORD
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Missing email or password' });
            return;
        }

        const user = await User.findOne({ where: { email } });
        if (!user || !user.is_verified) {
            res.status(401).json({ message: 'Invalid credentials or unverified email' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Retroactive Admin Interception
        if (isAdminEmail(email) && user.role !== UserRole.ADMIN) {
            user.role = UserRole.ADMIN;
            await user.save();
        }

        const authResponse = await buildAuthResponse(user);

        res.status(200).json({
            message: 'Logged in successfully',
            ...authResponse,
        });
    } catch (error) {
        logger.error('Login error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// LOGIN OTP REQUEST
export const loginOtpRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Missing email' });
            return;
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpToken = generateOtpToken({ email, otpHash });

        const emailTemplate = getLoginOtpEmail(otp);
        mailService.sendMail({
            to: email,
            ...emailTemplate
        }).catch(err => {
            logger.error('Failed to send async login OTP email', { error: err });
        });

        res.status(200).json({ message: 'OTP sent to email', otpToken });
    } catch (error) {
        logger.error('Login OTP request error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// LOGIN OTP VERIFY
export const loginOtpVerify = async (req: Request, res: Response): Promise<void> => {
    try {
        const { otp, otpToken } = req.body;
        if (!otp || !otpToken) {
            res.status(400).json({ message: 'Missing otp or otpToken' });
            return;
        }

        const payload = verifyToken<OtpTokenPayload>(otpToken);
        const isValid = await verifyOtpHash(otp, payload.otpHash);

        if (!isValid) {
            res.status(401).json({ message: 'Invalid OTP' });
            return;
        }

        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Retroactive Admin Interception
        if (isAdminEmail(user.email) && user.role !== UserRole.ADMIN) {
            user.role = UserRole.ADMIN;
            await user.save();
        }

        const authResponse = await buildAuthResponse(user);

        res.status(200).json({
            message: 'Logged in successfully via OTP',
            ...authResponse,
        });
    } catch (error) {
        logger.error('Login OTP verify error', { error });
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Missing email' });
            return;
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Do not reveal existence of user, just send generic success
            res.status(200).json({ message: 'If email exists, reset link will be sent.' });
            return;
        }

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpToken = generateOtpToken({ email, otpHash }); // Expires in 10 mins

        const emailTemplate = getResetPasswordOtpEmail(otp);
        mailService.sendMail({
            to: email,
            ...emailTemplate
        }).catch(err => {
            logger.error('Failed to send async reset password OTP email', { error: err });
        });

        res.status(200).json({ message: 'Password reset OTP sent', otpToken });
    } catch (error) {
        logger.error('Forgot password error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

// RESET PASSWORD
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { otp, otpToken, newPassword } = req.body;
        if (!otp || !otpToken || !newPassword) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const payload = verifyToken<OtpTokenPayload>(otpToken);
        const isValid = await verifyOtpHash(otp, payload.otpHash);

        if (!isValid) {
            res.status(401).json({ message: 'Invalid OTP' });
            return;
        }

        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Reset password error', { error });
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// Create client options for Google OAuth
const googleClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
});

// GOOGLE AUTH
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { credential, access_token, role } = req.body;
        if (!credential && !access_token) {
            res.status(400).json({ message: 'Missing Google credential or access token' });
            return;
        }

        let email = '';
        let name = 'Google User';

        if (credential) {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                res.status(400).json({ message: 'Invalid Google token' });
                return;
            }
            email = payload.email;
            name = payload.name || name;
        } else if (access_token) {
            // SECURITY: Verify the access token's audience to ensure it was issued to our application
            // This prevents "Confused Deputy" attacks
            try {
                const tokenInfo = await googleClient.getTokenInfo(access_token);
                if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
                    logger.warn('Access token audience mismatch', { aud: tokenInfo.aud, expected: process.env.GOOGLE_CLIENT_ID });
                    res.status(401).json({ message: 'Access token not issued for this application' });
                    return;
                }
            } catch (error) {
                logger.error('Google token info error', { error });
                res.status(401).json({ message: 'Invalid Google access token' });
                return;
            }

            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (!response.ok) {
                res.status(400).json({ message: 'Invalid Google access token' });
                return;
            }
            const data = await response.json();
            if (!data || !data.email) {
                res.status(400).json({ message: 'Invalid Google user info response' });
                return;
            }
            email = data.email;
            name = data.name || name;
        }

        let user = await User.findOne({ where: { email } });

        if (!user) {
            // New user via Google
            const isEmailAdmin = isAdminEmail(email);
            let userRole: UserRole;

            if (isEmailAdmin) {
                userRole = UserRole.ADMIN;
            } else {
                if (!role) {
                    res.status(404).json({ message: 'Account not found. Please sign up to create a new account.' });
                    return;
                }
                if (role !== 'BUYER' && role !== 'SELLER') {
                    res.status(400).json({ message: 'Invalid role provided during sign up.' });
                    return;
                }
                userRole = role === 'BUYER' ? UserRole.BUYER : UserRole.SELLER;
            }

            // Random secure password for OAuth users (they don't need it but DB requires it currently)
            const password_hash = await bcrypt.hash(Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12), 10);

            user = await User.create({
                email,
                password_hash,
                full_name: name,
                role: userRole,
                is_verified: true, // Google verifies emails
            });

            // Send welcome notification (async, non-blocking)
            notificationService.send(user.id, NotificationCategory.WELCOME, {
                message: `Hi ${name}! Welcome to SalesDuo. We're excited to have you on board. Explore your dashboard to get started.`,
            }).catch(err => {
                logger.error('Failed to send welcome notification', { error: err });
            });
        } else {
            // Retroactive Admin Interception check for existing users
            if (isAdminEmail(email) && user.role !== UserRole.ADMIN) {
                user.role = UserRole.ADMIN;
                await user.save();
            }
        }

        const authResponse = await buildAuthResponse(user);

        res.status(200).json({
            message: 'Google Auth successful',
            ...authResponse,
        });

    } catch (error) {
        logger.error('Google auth error', { error });
        res.status(401).json({ message: 'Invalid Google credential' });
    }
};

// POST-SIGNUP ONBOARDING
export const onboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const dbUser = await User.findByPk(user.userId);
        if (!dbUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (dbUser.role === UserRole.BUYER) {
            const { amazon_profile_url, region } = req.body;
            if (!amazon_profile_url || !region) {
                res.status(400).json({ message: 'Missing amazon_profile_url or region for BUYER' });
                return;
            }

            const existingProfile = await BuyerProfile.findOne({ where: { user_id: dbUser.id } });
            if (existingProfile) {
                res.status(400).json({ message: 'Buyer profile already exists' });
                return;
            }

            await BuyerProfile.create({
                user_id: dbUser.id,
                amazon_profile_url,
                region,
            });
        } else if (dbUser.role === UserRole.SELLER) {
            const { company_name } = req.body;
            // company_name can technically be optional based on current SellerProfile model, but industry standard requires it usually
            const existingProfile = await SellerProfile.findOne({ where: { user_id: dbUser.id } });
            if (existingProfile) {
                res.status(400).json({ message: 'Seller profile already exists' });
                return;
            }

            await SellerProfile.create({
                user_id: dbUser.id,
                company_name: company_name || null,
                stripe_customer_id: '',
            });
        }

        res.status(201).json({
            message: 'Onboarding completed successfully',
            user: { id: dbUser.id, email: dbUser.email, role: dbUser.role, is_verified: dbUser.is_verified, has_profile: true }
        });
    } catch (error) {
        logger.error('Onboarding error', { error });
        res.status(500).json({ message: 'Internal server error during onboarding' });
    }
};

// GET ME
export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const dbUser = await User.findByPk(user.userId);
        if (!dbUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const has_profile = await hasUserProfile(dbUser.id, dbUser.role);

        res.status(200).json({
            user: { id: dbUser.id, email: dbUser.email, role: dbUser.role, is_verified: dbUser.is_verified, has_profile }
        });
    } catch (error) {
        logger.error('Get me error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
