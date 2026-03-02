import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import BuyerProfile from '../models/BuyerProfile';
import SellerProfile from '../models/SellerProfile';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp';
import { generateAccessToken, generateRefreshToken, generateOtpToken, verifyToken, OtpTokenPayload } from '../utils/jwt';
import { mailService } from '../services/mail.service';
import { logger } from '../utils/logger';

// SIGNUP
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, role, amazon_profile_url, company_name } = req.body;

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
        if (role === 'BUYER' && !amazon_profile_url) {
            res.status(400).json({ message: 'Missing amazon_profile_url for BUYER' });
            return;
        }

        const userRole = role === 'BUYER' ? UserRole.BUYER : UserRole.SELLER;
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
            });
        } else {
            // For Seller
            await SellerProfile.create({
                user_id: newUser.id,
                company_name,
                stripe_customer_id: 'pending_stripe_customer_id_on_signup', // Mock for now
            });
        }

        // Generate OTP for email verification
        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpToken = generateOtpToken({ email, otpHash });

        // Send Email
        await mailService.sendMail({
            to: email,
            subject: 'SalesDuo - Verify your email',
            text: `Your verification code is: ${otp}`,
            html: `<p>Your verification code is: <strong>${otp}</strong></p>`
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

        const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

        res.status(200).json({
            message: 'Email verified successfully',
            tokens: { accessToken, refreshToken },
            user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified }
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

        const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

        res.status(200).json({
            message: 'Logged in successfully',
            tokens: { accessToken, refreshToken },
            user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified }
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

        await mailService.sendMail({
            to: email,
            subject: 'SalesDuo - Login OTP',
            text: `Your login code is: ${otp}`,
            html: `<p>Your login code is: <strong>${otp}</strong></p>`
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

        const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

        res.status(200).json({
            message: 'Logged in successfully via OTP',
            tokens: { accessToken, refreshToken },
            user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified }
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

        await mailService.sendMail({
            to: email,
            subject: 'SalesDuo - Reset Password',
            text: `Your password reset code is: ${otp}`,
            html: `<p>Your password reset code is: <strong>${otp}</strong></p>`
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
