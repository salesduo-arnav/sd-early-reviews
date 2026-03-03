import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const emailSchema = z.object({
    email: z.string().email(),
});

const otpVerifySchema = z.object({
    otp: z.string().length(6),
});

const newPasswordSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type Step = 'email' | 'otp' | 'new_password';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [emailForReset, setEmailForReset] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [otpCode, setOtpCode] = useState('');

    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'ADMIN') navigate('/admin', { replace: true });
            else if (user.role === 'BUYER') navigate('/buyer', { replace: true });
            else navigate('/seller', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    const otpForm = useForm<z.infer<typeof otpVerifySchema>>({
        resolver: zodResolver(otpVerifySchema),
        defaultValues: { otp: '' },
    });

    const newPasswordForm = useForm<z.infer<typeof newPasswordSchema>>({
        resolver: zodResolver(newPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
        try {
            const res = await authApi.forgotPassword({ email: data.email });
            if (res.otpToken) {
                setOtpToken(res.otpToken);
                setEmailForReset(data.email);
                setStep('otp');
            } else {
                // If the backend doesn't leak existence, it might just return success w/o token.
                // But our implementation returns otpToken.
                setEmailForReset(data.email);
                setStep('otp');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    const onOtpSubmit = (data: z.infer<typeof otpVerifySchema>) => {
        // Just save the OTP code and advance to new_password step
        setOtpCode(data.otp);
        setStep('new_password');
    };

    const onNewPasswordSubmit = async (data: z.infer<typeof newPasswordSchema>) => {
        try {
            await authApi.resetPassword({
                otp: otpCode,
                otpToken,
                newPassword: data.password
            });
            navigate('/login');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    const leftContent = {
        title: t('auth.forgot_password_title', 'Reset Your Password'),
        subtitle: t('auth.forgot_password_subtitle', 'Regain access to your SalesDuo account securely and continue managing your reviews and reimbursements.'),
        features: [
            {
                title: t('auth.forgot_feature1_title', 'Secure Process'),
                description: t('auth.forgot_feature1_desc', 'Your account safety is our priority with multi-step verification.'),
            },
            {
                title: t('auth.forgot_feature2_title', 'Fast Recovery'),
                description: t('auth.forgot_feature2_desc', 'Get back to your dashboard in minutes with automated recovery.'),
            },
            {
                title: t('auth.forgot_feature3_title', '24/7 Support'),
                description: t('auth.forgot_feature3_desc', 'Need help? Our team is always here to assist with account access.'),
            }
        ]
    };

    return (
        <SplitScreenLayout leftContent={leftContent}>
            <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <Link to="/login" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground w-fit mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('auth.back_to_login', 'Back to login')}
                </Link>

                <div className="flex flex-col space-y-2 text-center lg:text-left">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {step === 'email' && t('auth.forgot_heading', 'Forgot password?')}
                        {step === 'otp' && t('auth.check_your_email', 'Check your email')}
                        {step === 'new_password' && t('auth.set_new_password', 'Set new password')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {step === 'email' && t('auth.forgot_description', "No worries, we'll send you reset instructions.")}
                        {step === 'otp' && (
                            <>
                                {t('auth.we_sent_reset_code', 'We sent a password reset code to')}{' '}
                                <span className="font-medium text-foreground">{emailForReset}</span>
                            </>
                        )}
                        {step === 'new_password' && t('auth.new_password_description', 'Your new password must be different from previously used passwords.')}
                    </p>
                </div>

                {step === 'email' && (
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('auth.email', 'Email')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">
                                {t('auth.send_instructions', 'Send Instructions')}
                            </Button>
                        </form>
                    </Form>
                )}

                {step === 'otp' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                                <FormField
                                    control={otpForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col lg:items-start items-center">
                                            <FormControl>
                                                <InputOTP maxLength={6} {...field}>
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={0} />
                                                        <InputOTPSlot index={1} />
                                                        <InputOTPSlot index={2} />
                                                    </InputOTPGroup>
                                                    <InputOTPSeparator />
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={3} />
                                                        <InputOTPSlot index={4} />
                                                        <InputOTPSlot index={5} />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">
                                    {t('auth.verify_code', 'Verify Code')}
                                </Button>
                            </form>
                        </Form>
                    </div>
                )}

                {step === 'new_password' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                        <Form {...newPasswordForm}>
                            <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={newPasswordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.password_setup', 'Password')}</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newPasswordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.confirm_password', 'Confirm')}</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">
                                    {t('auth.reset_password', 'Reset Password')}
                                </Button>
                            </form>
                        </Form>
                    </div>
                )}
            </div>
        </SplitScreenLayout>
    );
}
