import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Logo — marca Ledger.
 *
 * `variant="wordmark"` (padrão) desenha a palavra inteira.
 * `variant="icon"` desenha só o "e", para ícone de app, favicon e avatar.
 *
 * A cor vem de `tone`; `tone="current"` herda `currentColor`, o que permite
 * usar o logotipo dentro de qualquer superfície já colorida.
 */

const logoVariants = cva('shrink-0 select-none', {
  variants: {
    tone: {
      current: 'text-current',
      navy: 'text-primary',
      teal: 'text-accent',
      white: 'text-white',
    },
  },
  defaultVariants: { tone: 'navy' },
});

const GEOMETRY = {
  wordmark: { viewBox: '0 0 348 124', ratio: 348 / 124, transform: 'translate(22 0) skewX(-11)' },
  icon: { viewBox: '0 0 64 64', ratio: 1, transform: 'translate(14.7 -28) skewX(-11)' },
} as const;

export interface LogoProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'ref'>,
    VariantProps<typeof logoVariants> {
  /** wordmark (padrão) ou icon */
  variant?: 'wordmark' | 'icon';
  /** altura em px; a largura acompanha a proporção */
  size?: number;
  /** texto acessível; use null para marcar como decorativo */
  title?: string | null;
}

const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
  ({ className, variant = 'wordmark', tone, size = 32, title = 'ledger', ...props }, ref) => {
    const g = GEOMETRY[variant];
    return (
      <svg
        ref={ref}
        viewBox={g.viewBox}
        height={size}
        width={Math.round(size * g.ratio)}
        fill="none"
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        className={cn(logoVariants({ tone }), className)}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        <g transform={g.transform} stroke="currentColor" strokeWidth={16} strokeLinecap="butt">
          {variant === 'icon' ? (
            <path d="M8 60H52A22 22 0 1 0 44.14 76.85" />
          ) : (
            <>
              <path d="M8 8V90" />
              <path d="M32 60H76A22 22 0 1 0 68.14 76.85" />
              <circle cx="122" cy="60" r="22" />
              <path d="M144 8V90" />
              <circle cx="190" cy="60" r="22" />
              <path d="M212 30V86A22 22 0 0 1 170.06 95.3" />
              <path d="M236 60H280A22 22 0 1 0 272.14 76.85" />
              <path d="M304 90V54c0-12 10-18 23-18" />
            </>
          )}
        </g>
      </svg>
    );
  },
);
Logo.displayName = 'Logo';

export { Logo, logoVariants };
