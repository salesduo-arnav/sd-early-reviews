import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';

const passwordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const otpEmailSchema = z.object({
    email: z.string().email(),
});

const otpVerifySchema = z.object({
    otp: z.string().length(6),
});

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [otpSent, setOtpSent] = useState(false);
    const [emailForOtp, setEmailForOtp] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const loginStore = useAuthStore(state => state.login);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'ADMIN') navigate('/admin', { replace: true });
            else if (user.role === 'BUYER') navigate('/buyer', { replace: true });
            else navigate('/seller', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { email: '', password: '' },
    });

    const otpEmailForm = useForm<z.infer<typeof otpEmailSchema>>({
        resolver: zodResolver(otpEmailSchema),
        defaultValues: { email: '' },
    });

    const otpVerifyForm = useForm<z.infer<typeof otpVerifySchema>>({
        resolver: zodResolver(otpVerifySchema),
        defaultValues: { otp: '' },
    });

    const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
        try {
            const res = await authApi.login(data);
            if (res.user && res.tokens) {
                loginStore(res.user, res.tokens);
                if (res.user.role === 'ADMIN') navigate('/admin');
                else if (res.user.role === 'BUYER') navigate('/buyer');
                else navigate('/seller');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    const onOtpEmailSubmit = async (data: z.infer<typeof otpEmailSchema>) => {
        try {
            const res = await authApi.loginOtpRequest({ email: data.email });
            if (res.otpToken) {
                setOtpToken(res.otpToken);
                setEmailForOtp(data.email);
                setOtpSent(true);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    const onOtpVerifySubmit = async (data: z.infer<typeof otpVerifySchema>) => {
        try {
            const res = await authApi.loginOtpVerify({ otp: data.otp, otpToken });
            if (res.user && res.tokens) {
                loginStore(res.user, res.tokens);
                if (res.user.role === 'ADMIN') navigate('/admin');
                else if (res.user.role === 'BUYER') navigate('/buyer');
                else navigate('/seller');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    const leftContent = {
        title: t('auth.login_title', 'Welcome Back to SalesDuo'),
        subtitle: t('auth.login_subtitle', 'Sign in to access your dashboard, track your reviews, and manage your account seamlessly.'),
        features: [
            {
                title: t('auth.feature1_title', 'Real-time Analytics'),
                description: t('auth.feature1_desc', 'Track the performance of your listings and monitor early review impacts.'),
            },
            {
                title: t('auth.feature2_title', 'Secure & Smooth'),
                description: t('auth.feature2_desc', 'Experience highly secure authentication powered by advanced standards.'),
            },
            {
                title: t('auth.feature3_title', 'Dedicated Support'),
                description: t('auth.feature3_desc', 'Get anytime access to our specialized support teams for sellers and buyers.'),
            }
        ]
    };

    return (
        <SplitScreenLayout leftContent={leftContent}>
            <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <div className="flex flex-col space-y-2 text-center lg:text-left">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('auth.sign_in', 'Sign In')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('auth.enter_details', 'Enter your details below to access your account')}
                    </p>
                </div>

                <Tabs defaultValue="password" className="w-full">
                    {!otpSent && (
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="password">{t('auth.password', 'Password')}</TabsTrigger>
                            <TabsTrigger value="otp">{t('auth.otp', 'Login with OTP')}</TabsTrigger>
                        </TabsList>
                    )}

                    <TabsContent value="password">
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
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
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>{t('auth.password_field', 'Password')}</FormLabel>
                                                <Link to="/forgot-password" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
                                                    {t('auth.forgot_password', 'Forgot password?')}
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">{t('auth.login_btn', 'Login')}</Button>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="otp">
                        {!otpSent ? (
                            <Form {...otpEmailForm}>
                                <form onSubmit={otpEmailForm.handleSubmit(onOtpEmailSubmit)} className="space-y-4">
                                    <FormField
                                        control={otpEmailForm.control}
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
                                    <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">{t('auth.send_otp', 'Send OTP')}</Button>
                                </form>
                            </Form>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <button onClick={() => setOtpSent(false)} className="hover:text-foreground flex items-center transition-colors">
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        {t('auth.back_to_email', 'Back to Email')}
                                    </button>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {t('auth.otp_sent_to', 'We sent a 6-digit code to')}{' '}
                                    <span className="font-medium text-foreground">{emailForOtp}</span>.
                                </div>
                                <Form {...otpVerifyForm}>
                                    <form onSubmit={otpVerifyForm.handleSubmit(onOtpVerifySubmit)} className="space-y-6">
                                        <FormField
                                            control={otpVerifyForm.control}
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
                                        <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">{t('auth.verify_otp', 'Verify OTP')}</Button>
                                    </form>
                                </Form>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="text-center lg:text-left text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
                    {t('auth.dont_have_account', "Don't have an account?")}{" "}
                    <Link to="/signup?role=buyer" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
                        {t('auth.sign_up_buyer', 'Sign up as Buyer')}
                    </Link>
                    {" "}{t('auth.or', 'or')}{" "}
                    <Link to="/signup?role=seller" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
                        {t('auth.sign_up_seller', 'Seller')}
                    </Link>
                </div>
            </div>
        </SplitScreenLayout>
    );
}
