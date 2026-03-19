import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[--accent-blue] text-[--layer-0] shadow hover:bg-[--accent-blue]/80',
        secondary:
          'border-transparent bg-[--layer-3] text-[--text-secondary] hover:bg-[--layer-3]/80',
        destructive:
          'border-transparent bg-[--accent-red] text-[--text-primary] shadow hover:bg-[--accent-red]/80',
        outline: 'text-[--text-primary] border-[--border-bright]',
        success:
          'border-transparent bg-[--accent-green]/20 text-[--accent-green] border-[--accent-green]/30',
        warning:
          'border-transparent bg-[--accent-amber]/20 text-[--accent-amber] border-[--accent-amber]/30',
        info:
          'border-transparent bg-[--accent-blue]/20 text-[--accent-blue] border-[--accent-blue]/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
