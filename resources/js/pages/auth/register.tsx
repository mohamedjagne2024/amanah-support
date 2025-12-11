import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link } from '@inertiajs/react';

import InputError from '@/components/input-error';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

export default function Register() {
    return (
        <AuthSimpleLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="text-left w-full mt-10"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-4">
                            <label
                                htmlFor="name"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                className="form-input"
                                placeholder="Full name"
                            />
                            <InputError message={errors.name} />
                        </div>

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
                                tabIndex={2}
                                autoComplete="email"
                                className="form-input"
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="mb-4">
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
                                tabIndex={3}
                                autoComplete="new-password"
                                className="form-input"
                                placeholder="Password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="password_confirmation"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Confirm password
                            </label>
                            <input
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                className="form-input"
                                placeholder="Confirm password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                                        Processing...
                                    </span>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-base text-default-500">
                                Already have an Account ?{' '}
                                <Link
                                    href={login()}
                                    className="font-semibold underline hover:text-primary transition duration-200"
                                    tabIndex={6}
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
