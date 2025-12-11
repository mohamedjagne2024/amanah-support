import InputError from '@/components/input-error';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { store } from '@/routes/two-factor/login';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string[]>(
        Array.from({ length: OTP_MAX_LENGTH }, () => ''),
    );
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery Code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication Code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            toggleText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode(Array.from({ length: OTP_MAX_LENGTH }, () => ''));
    };

    const handleOTPChange = (
        index: number,
        value: string,
        processing: boolean,
    ) => {
        if (processing) return;

        // Only allow digits
        const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);

        // Move to next input if digit entered
        if (digit && index < OTP_MAX_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
        processing: boolean,
    ) => {
        if (processing) return;

        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        processing: boolean,
    ) => {
        if (processing) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_MAX_LENGTH);
        const newCode = Array.from({ length: OTP_MAX_LENGTH }, (_, i) => pastedData[i] || '');
        setCode(newCode);

        // Focus the next empty input or the last one
        const nextIndex = Math.min(pastedData.length, OTP_MAX_LENGTH - 1);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <AuthSimpleLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <Head title="Two-Factor Authentication" />

            <Form
                {...store.form()}
                transform={(data) => {
                    if (!showRecoveryInput) {
                        return { ...data, code: code.join('') };
                    }
                    return data;
                }}
                className="text-left w-full mt-10"
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <div className="mb-4">
                                <label
                                    htmlFor="recovery_code"
                                    className="block font-medium text-default-900 text-sm mb-2"
                                >
                                    Recovery Code
                                </label>
                                <input
                                    type="text"
                                    id="recovery_code"
                                    name="recovery_code"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    className="form-input"
                                    placeholder="Enter recovery code"
                                />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <input
                                    type="hidden"
                                    name="code"
                                    value={code.join('')}
                                />
                                <label className="block font-medium text-default-900 text-sm mb-2">
                                    Authentication Code
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {Array.from(
                                        { length: OTP_MAX_LENGTH },
                                        (_, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => {
                                                    inputRefs.current[index] =
                                                        el;
                                                }}
                                                type="text"
                                                className="form-input text-center"
                                                placeholder="•"
                                                maxLength={1}
                                                value={code[index]}
                                                onChange={(e) =>
                                                    handleOTPChange(
                                                        index,
                                                        e.target.value,
                                                        processing,
                                                    )
                                                }
                                                onKeyDown={(e) =>
                                                    handleKeyDown(
                                                        index,
                                                        e,
                                                        processing,
                                                    )
                                                }
                                                onPaste={(e) =>
                                                    handlePaste(e, processing)
                                                }
                                                disabled={processing}
                                                autoFocus={index === 0}
                                                tabIndex={index + 1}
                                            />
                                        ),
                                    )}
                                </div>
                                <InputError message={errors.code} />
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <button
                                type="submit"
                                className="btn bg-primary text-white w-full"
                                tabIndex={OTP_MAX_LENGTH + 2}
                                disabled={processing}
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Continue
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-base text-default-500">
                                <span>or you can </span>
                                <button
                                    type="button"
                                    className="font-semibold underline hover:text-primary transition duration-200"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                    tabIndex={OTP_MAX_LENGTH + 3}
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </AuthSimpleLayout>
    );
}
