'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import RadioField from "@/components/forms/RadioGroupField";
import TagChipField from "@/components/forms/TagChipField";
import PasswordRequirements from "@/components/forms/PasswordRequirements";
import { INVESTMENT_GOALS, PASSWORD_VALIDATION, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React from "react";
import { AuthLeftPanel } from "@/components/auth/AuthPanels";

const SignUp = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'IN',
            investmentGoals: 'Growth',
            riskTolerance: 'Balanced',
            preferredIndustry: ['Technology', 'Finance']
        },
        mode: 'onBlur'
    },);

    const passwordValue = watch('password');

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error('Sign up failed', {
                description: result.error ?? 'We could not create your account.',
            });
        } catch (e) {
            console.error(e);
            toast.error('Sign up failed', {
                description: e instanceof Error ? e.message : 'Failed to create an account.'
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="contents">
            <AuthLeftPanel>
                <h1 className="form-title">Sign Up & Personalize</h1>

                <div className="space-y-5">
                    <InputField
                        name="fullName"
                        label="Full Name"
                        placeholder="Enter full name"
                        register={register}
                        error={errors.fullName}
                        validation={{ required: 'Full name is required', minLength: 2 }}
                    />

                    <InputField
                        name="email"
                        label="Email"
                        placeholder="you@example.com"
                        register={register}
                        error={errors.email}
                        validation={{
                            required: 'Email is required',
                            pattern: {
                                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/,
                                message: 'Please enter a valid email address'
                            }
                        }}
                    />

                    <InputField
                        name="password"
                        label="Password"
                        placeholder="Enter a strong password"
                        type="password"
                        register={register}
                        error={errors.password}
                        validation={PASSWORD_VALIDATION}
                    />
                    <PasswordRequirements password={passwordValue ?? ''} />

                    <CountrySelectField
                        name="country"
                        label="Country"
                        control={control}
                        error={errors.country}
                        required
                    />
                </div>
            </AuthLeftPanel>

            <section className="auth-right-section gap-7">
                <RadioField
                    name="investmentGoals"
                    label="Investment Goals"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    variant="stacked"
                    required
                />

                <div className="border-t-2 border-gray-600" />

                <RadioField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    variant="segmented"
                    required
                />

                <div className="border-t-2 border-gray-600" />

                <TagChipField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-auto">
                    {isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}
                </Button>

                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />
            </section>
        </form>
    )
}
export default SignUp;
