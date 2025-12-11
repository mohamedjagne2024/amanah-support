export default function InputError({
    message,
    className = '',
}: {
    message?: string;
    className?: string;
}) {
    return message ? (
        <div className={`mt-1 text-sm text-red-600 ${className}`}>{message}</div>
    ) : null;
}

