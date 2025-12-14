import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  /** The main title to display (required) */
  title: string;
  /** Optional icon component from lucide-react */
  icon?: LucideIcon;
  /** Optional count to display in a badge */
  count?: number;
  /** Optional subtitle text */
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon: Icon,
  count,
  subtitle,
}) => {
  return (
    <div className="mb-6 flex items-start gap-3">
      {/* Icon - Only render if icon is provided */}
      {Icon && (
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Icon className="size-6 text-white" />
        </div>
      )}
      
      {/* Title, Badge, and Subtitle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-default-900">{title}</h1>
          {/* Count Badge - Only render if count is provided */}
          {count !== undefined && count !== null && (
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {count}
            </span>
          )}
        </div>
        {/* Subtitle - Only render if subtitle is provided */}
        {subtitle && (
          <p className="text-default-600 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
