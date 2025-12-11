import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

export default function TextLink({
    href,
    children,
    className = '',
    ...props
}: {
    href: string;
    children: ReactNode;
    className?: string;
    [key: string]: unknown;
}) {
    return (
        <Link
            href={href}
            className={`text-primary hover:underline ${className}`}
            {...props}
        >
            {children}
        </Link>
    );
}

