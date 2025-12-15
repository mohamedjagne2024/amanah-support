import InputError from '@/components/input-error';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Link } from '@inertiajs/react';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import PageMeta from '@/components/PageMeta';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    return (
        <AuthSimpleLayout
            title="Welcome Back !"
            description="Sign in to continue to Amanah Assets."
        >
            <PageMeta title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="text-left w-full mt-10"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Username/ Email ID
                            </label>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                className="form-input"
                                placeholder="Enter Username or email"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="mb-4">
                            {canResetPassword && (
                                <Link
                                    href={request()}
                                    className="text-primary font-medium text-sm mb-2 float-end"
                                >
                                    Forgot Password ?
                                </Link>
                            )}
                            <label
                                htmlFor="password"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                className="form-input"
                                placeholder="Enter Password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                className="form-checkbox"
                                tabIndex={3}
                            />
                            <label
                                className="text-default-900 text-sm font-medium"
                                htmlFor="remember"
                            >
                                Remember Me
                            </label>
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                                        Processing...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
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
