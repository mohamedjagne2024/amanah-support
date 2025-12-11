import { update } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthSimpleLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="text-left w-full mt-10"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block font-medium text-default-900 text-sm mb-2"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                readOnly
                                tabIndex={1}
                                className="form-input"
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
                                autoComplete="new-password"
                                autoFocus
                                tabIndex={2}
                                className="form-input"
                                placeholder="Enter Password"
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
                                autoComplete="new-password"
                                tabIndex={3}
                                className="form-input"
                                placeholder="Confirm Password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="reset-password-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Reset password
                            </button>
                        </div>
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
