import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Logo — marca Ordo.
 *
 * `variant="wordmark"` (padrão) desenha a palavra inteira.
 * `variant="icon"` desenha só o "o", para ícone de app, favicon e avatar.
 *
 * A cor vem de `tone`; `tone="current"` herda `currentColor`, o que permite
 * usar o logotipo dentro de qualquer superfície já colorida.
 */

const logoVariants = cva('shrink-0 select-none', {
  variants: {
    tone: {
      current: 'text-current',
      navy: 'text-secondary',
      teal: 'text-primary',
      white: 'text-white',
    },
  },
  defaultVariants: { tone: 'navy' },
});

const GEOMETRY = {
  wordmark: { viewBox: '0 0 250 100', ratio: 2.5, transform: 'translate(16 0) skewX(-11)' },
  icon: { viewBox: '0 0 69 44', ratio: 69 / 44, transform: 'translate(16 -38) skewX(-11)' },
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
  ({ className, variant = 'wordmark', tone, size = 32, title = 'ordo', ...props }, ref) => {
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
          <circle cx="30" cy="60" r="22" />
          {variant === 'wordmark' && (
            <>
              <path d="M76 90V54c0-12 10-18 23-18" />
              <circle cx="133" cy="60" r="22" />
              <path d="M155 8v82" />
              <circle cx="201" cy="60" r="22" />
            </>
          )}
        </g>
      </svg>
    );
  },
);
Logo.displayName = 'Logo';

export { Logo, logoVariants };
