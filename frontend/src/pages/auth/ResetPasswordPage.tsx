import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const onSubmit = (data: z.infer<typeof resetPasswordSchema>) => {
        console.log('Resetting password with token:', token, 'Data:', data);
        // Add logic to call backend with the new password and token
        navigate('/login');
    };

    const leftContent = {
        title: t('auth.reset_password_title', 'Create New Password'),
        subtitle: t('auth.reset_password_subtitle', 'Secure your account with a strong new password to continue using SalesDuo.'),
        features: [
            {
                title: t('auth.reset_feature1_title', 'Strong Security'),
                description: t('auth.reset_feature1_desc', 'Use a combination of letters, numbers, and symbols for better security.'),
            },
            {
                title: t('auth.reset_feature2_title', 'Instant Access'),
                description: t('auth.reset_feature2_desc', 'Log in immediately after your new password is saved.'),
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
                <div className="flex flex-col space-y-2 text-center lg:text-left">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {t('auth.set_new_password', 'Set new password')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('auth.new_password_description', 'Your new password must be different from previously used passwords.')}
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Button type="submit" className="w-full shadow-md text-base mt-2 py-6">
                            {t('auth.save_new_password', 'Save New Password')}
                        </Button>
                    </form>
                </Form>
            </div>
        </SplitScreenLayout>
    );
}
