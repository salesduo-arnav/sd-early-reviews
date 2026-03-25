import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { getMarketplaceOptions, getAmazonDomain } from '@/lib/regions';

type Role = 'seller' | 'buyer';

export default function SignupPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';
    const [role, setRole] = useState<Role>(initialRole);

    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [signedUpEmail, setSignedUpEmail] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const login = useAuthStore(state => state.login);

    useEffect(() => {
        const r = searchParams.get('role');
        if (r === 'seller' || r === 'buyer') {
            setRole(r);
        }
    }, [searchParams]);

    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'ADMIN') navigate('/admin', { replace: true });
            else if (user.role === 'BUYER') navigate('/buyer', { replace: true });
            else navigate('/seller', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleRoleChange = (newRole: Role) => {
        setRole(newRole);
        setSearchParams({ role: newRole });
    };

    const signupSchema = React.useMemo(() => z.object({
        fullName: z.string().min(2, t('validation.name_too_short', 'Name is too short')),
        email: z.string().email(t('validation.invalid_email', 'Invalid email address')),
        password: z.string().min(8, t('validation.password_too_short', 'Password must be at least 8 characters')),
        confirmPassword: z.string().min(8, t('validation.password_too_short', 'Password must be at least 8 characters')),
        amazonProfileUrl: z.string().optional(),
        region: z.string().optional(),
        companyName: z.string().optional(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('validation.passwords_dont_match', "Passwords don't match"),
        path: ["confirmPassword"],
    }), [t]);

    const otpVerifySchema = React.useMemo(() => z.object({
        otp: z.string().length(6, t('validation.otp_length', 'OTP must be 6 digits')),
    }), [t]);

    type SignupFormValues = z.infer<typeof signupSchema>;
    type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', amazonProfileUrl: '', region: '', companyName: '' },
    });

    const otpForm = useForm<OtpVerifyFormValues>({
        resolver: zodResolver(otpVerifySchema),
        defaultValues: { otp: '' },
    });

    const onSubmit = async (data: SignupFormValues) => {
        try {
            const res = await authApi.signup({
                email: data.email,
                password: data.password,
                full_name: data.fullName,
                role: role === 'buyer' ? 'BUYER' : 'SELLER',
                amazon_profile_url: data.amazonProfileUrl,
                region: data.region,
                company_name: data.companyName
            });
            if (res.otpToken) {
                setOtpToken(res.otpToken);
                setSignedUpEmail(data.email);
                setIsOtpModalOpen(true);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleGoogleSuccess = async (response: { credential?: string; access_token?: string }) => {
        try {
            if (!response.credential && !response.access_token) return;
            const res = await authApi.googleAuth({
                credential: response.credential,
                access_token: response.access_token,
                role: role === 'buyer' ? 'BUYER' : 'SELLER'
            });
            if (res.user && res.tokens) {
                login(res.user, res.tokens);
                // Router handles /onboarding redirect automatically
                if (res.user.role === 'ADMIN') navigate('/admin');
                else if (res.user.role === 'BUYER') navigate('/buyer');
                else navigate('/seller');
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const onOtpSubmit = async (data: OtpVerifyFormValues) => {
        try {
            const res = await authApi.verifyEmail({ otp: data.otp, otpToken });
            setIsOtpModalOpen(false);
            if (res.user && res.tokens) {
                login(res.user, res.tokens);
                if (res.user.role === 'ADMIN') navigate('/admin');
                else if (res.user.role === 'BUYER') navigate('/buyer');
                else navigate('/seller');
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const buyerLeftContent = {
        title: t('auth.buyer_signup_title', 'Get Paid for Your Honest Opinion'),
        subtitle: t('auth.buyer_signup_subtitle', 'Join SalesDuo as a buyer to discover amazing new products, try them out, and get reimbursed for leaving insightful reviews.'),
        features: [
            {
                title: t('auth.buyer_feature1_title', 'Browse Premium Products'),
                description: t('auth.buyer_feature1_desc', 'Get exclusive access to pre-launch and high-quality items.'),
            },
            {
                title: t('auth.buyer_feature2_title', 'Get Reimbursed Fast'),
                description: t('auth.buyer_feature2_desc', 'Submit your review and get your promised cashback instantly.'),
            },
            {
                title: t('auth.buyer_feature3_title', 'Build Your Reputation'),
                description: t('auth.buyer_feature3_desc', 'High-quality reviews earn you trust and more premium product offers.'),
            }
        ]
    };

    const sellerLeftContent = {
        title: t('auth.seller_signup_title', 'Boost Your Launch with Early Reviews'),
        subtitle: t('auth.seller_signup_subtitle', 'Join SalesDuo as a seller to list your products, connect with verified buyers, and acquire authentic reviews legally.'),
        features: [
            {
                title: t('auth.seller_feature1_title', 'Verified Buyer Pool'),
                description: t('auth.seller_feature1_desc', 'Access our curated list of trusted buyers ready to review.'),
            },
            {
                title: t('auth.seller_feature2_title', 'Full Compliance'),
                description: t('auth.seller_feature2_desc', 'Our platform adheres to marketplace guidelines for safe reviewing.'),
            },
            {
                title: t('auth.seller_feature3_title', 'Track ROI effectively'),
                description: t('auth.seller_feature3_desc', 'Dashboard to monitor reimbursements and review completion rates.'),
            }
        ]
    };

    const currentContent = role === 'seller' ? sellerLeftContent : buyerLeftContent;

    return (
        <>
            <SplitScreenLayout leftContent={currentContent}>
                <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('auth.create_account', 'Create Account')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {t('auth.join_as', 'Join SalesDuo to get started')}
                        </p>
                    </div>

                    <div className="bg-muted/50 p-1 rounded-xl grid grid-cols-2 gap-1 mb-2">
                        <button
                            onClick={() => handleRoleChange('buyer')}
                            type="button"
                            className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'buyer' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            {t('auth.im_a_buyer', "I'm a Buyer")}
                        </button>
                        <button
                            onClick={() => handleRoleChange('seller')}
                            type="button"
                            className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'seller' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            {t('auth.im_a_seller', "I'm a Seller")}
                        </button>
                    </div>

                    <div className="mt-4 mb-4">
                        <GoogleButton
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error('Google Signup Failed')}
                            text={t('auth.signup_with_google', 'Sign up with Google')}
                        />
                    </div>

                    <div className="relative mb-6 mt-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t('auth.or_continue_with_email', 'Or continue with email')}</span>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('auth.full_name', 'Full Name')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
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
                            {role === 'buyer' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="region"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('auth.region', 'Region')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Region" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {getMarketplaceOptions().map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="amazonProfileUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center space-x-2">
                                                    <FormLabel>{t('auth.amazon_profile_url', 'Amazon Profile URL')}</FormLabel>
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[250px] p-3 text-sm">
                                                                <p>To find your profile URL, go to <a href={`https://${getAmazonDomain(form.watch('region') || 'US')}/gp/profile`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">{getAmazonDomain(form.watch('region') || 'US')}/gp/profile</a> while logged into your Amazon account.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <FormControl>
                                                    <Input placeholder={`https://${getAmazonDomain(form.watch('region') || 'US')}/gp/profile/amzn1.account...`} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                            {role === 'seller' && (
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.company_name', 'Company Name')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Corp" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
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
                                    control={form.control}
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
                            </div>
                            <Button type="submit" className="w-full mt-2 shadow-md text-base py-6">{t('auth.signup_btn', 'Create Account')}</Button>
                        </form>
                    </Form>

                    <div className="text-center lg:text-left text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
                        {t('auth.already_have_account', "Already have an account?")}{" "}
                        <Link to="/login" className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
                            {t('auth.login_here', 'Log in')}
                        </Link>
                    </div>
                </div>
            </SplitScreenLayout>

            <Dialog open={isOtpModalOpen} onOpenChange={(open) => {
                if (!open) setIsOtpModalOpen(false);
            }}>
                <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold tracking-tight">{t('auth.verify_your_email', 'Verify your email')}</DialogTitle>
                        <DialogDescription className="text-center pt-2 text-base">
                            {t('auth.we_sent_code', 'We sent a verification code to')} <br />
                            <span className="font-semibold text-foreground">{signedUpEmail}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-6">
                        <Form {...otpForm}>
                            <form id="otp-form" onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                                <FormField
                                    control={otpForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center">
                                            <FormControl>
                                                <InputOTP maxLength={6} {...field} className="gap-2">
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={0} className="w-12 h-14 text-lg border-2 rounded-l-md" />
                                                        <InputOTPSlot index={1} className="w-12 h-14 text-lg border-2" />
                                                        <InputOTPSlot index={2} className="w-12 h-14 text-lg border-2 rounded-r-md" />
                                                    </InputOTPGroup>
                                                    <InputOTPSeparator />
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={3} className="w-12 h-14 text-lg border-2 rounded-l-md" />
                                                        <InputOTPSlot index={4} className="w-12 h-14 text-lg border-2" />
                                                        <InputOTPSlot index={5} className="w-12 h-14 text-lg border-2 rounded-r-md" />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button form="otp-form" type="submit" className="w-full text-base py-6 shadow-md">
                            {t('auth.verify_and_continue', 'Verify & Continue')}
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => setIsOtpModalOpen(false)}>
                            {t('auth.cancel', 'Cancel')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
