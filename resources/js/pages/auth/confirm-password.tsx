import InputError from '@/components/input-error';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import PageMeta from '@/components/PageMeta';
import { store } from '@/routes/password/confirm';
import { Form } from '@inertiajs/react';

export default function ConfirmPassword() {
    return (
        <AuthSimpleLayout
            title="Confirm Password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <PageMeta title="Confirm password" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="text-left w-full mt-10"
            >
                {({ processing, errors }) => (
                    <>
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
                                autoFocus
                                tabIndex={1}
                                autoComplete="current-password"
                                className="form-input"
                                placeholder="Enter Password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={2}
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                                        Processing...
                                    </span>
                                ) : (
                                    'Confirm Password'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
