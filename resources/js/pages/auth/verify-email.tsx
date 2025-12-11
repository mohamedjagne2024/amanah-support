import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthSimpleLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            <Form {...send.form()} className="text-left w-full mt-10">
                {({ processing }) => (
                    <>
                        {status === 'verification-link-sent' && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600">
                                A new verification link has been sent to the
                                email address you provided during registration.
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={1}
                                disabled={processing}
                                data-test="resend-verification-email-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Resend verification email
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-base text-default-500">
                                <Link
                                    href={logout.url()}
                                    method="post"
                                    as="button"
                                    className="font-semibold underline hover:text-primary transition duration-200"
                                    tabIndex={2}
                                >
                                    Log out
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
