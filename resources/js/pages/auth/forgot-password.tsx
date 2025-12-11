import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthSimpleLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            <Form
                {...email.form()}
                className="text-left w-full mt-10"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Email address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                className="form-input"
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={2}
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Email password reset link
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-base text-default-500">
                                Remember your password?{' '}
                                <Link
                                    href={login()}
                                    className="font-semibold underline hover:text-primary transition duration-200"
                                    tabIndex={3}
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>

                        {status && (
                            <div className="mt-4 text-center text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
