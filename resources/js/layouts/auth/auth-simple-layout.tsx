import { type PropsWithChildren } from 'react';
import ProvidersWrapper from '@/components/ProvidersWrapper';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <ProvidersWrapper>
            <div className="relative flex min-h-screen w-full items-center justify-center py-16 md:py-10">
            <div className="card z-10 w-screen md:max-w-lg">
                <div className="px-10 py-12 text-center">
                    <div className="flex justify-center">
                        <img
                            src="/assets/images/logo-dark.png"
                            alt="logo"
                            className="w-52 block dark:hidden"
                        />
                        <img
                            src="/assets/images/logo-light.png"
                            alt="logo"
                            className="w-52 hidden dark:block"
                        />
                    </div>

                    <div className="mt-8 text-center">
                        <h4 className="mb-2.5 text-xl font-semibold text-primary">
                            {title}
                        </h4>
                        <p className="text-base text-default-500">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>

            <div className="absolute inset-0 overflow-hidden">
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 size-full fill-black/2 stroke-black/5 dark:fill-white/2.5 dark:stroke-white/2.5"
                >
                    <defs>
                        <pattern
                            id="authPattern"
                            width="56"
                            height="56"
                            patternUnits="userSpaceOnUse"
                            x="50%"
                            y="16"
                        >
                            <path d="M.5 56V.5H72" fill="none"></path>
                        </pattern>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        strokeWidth="0"
                        fill="url(#authPattern)"
                    ></rect>
                </svg>
            </div>
        </div>
        </ProvidersWrapper>
    );
}
