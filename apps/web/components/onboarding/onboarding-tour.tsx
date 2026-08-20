'use client';

import * as React from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export interface TourStep {
  id: string;
  target?: string;
  title: string;
  description: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({ steps, open, onClose }: OnboardingTourProps) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];

  const measure = React.useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  React.useEffect(() => {
    if (!open) return;
    measure();
    const timer = window.setTimeout(measure, 220);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;

  function next() {
    if (isLast) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  const cardStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: Math.min(rect.top + rect.height + 12, window.innerHeight - 220),
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 336),
      }
    : {};

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar tour"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-neutral/60 backdrop-blur-[1px]"
      />

      {rect && (
        <div
          className="pointer-events-none fixed rounded-lg ring-4 ring-primary/70 transition-all duration-300 ease-out"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
          }}
        />
      )}

      <div
        className={
          rect
            ? 'w-[320px] rounded-xl border border-base-300 bg-base-100 p-5 shadow-2xl'
            : 'fixed left-1/2 top-1/2 w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-base-300 bg-base-100 p-6 shadow-2xl'
        }
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Passo {index + 1} de {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pular tour"
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3 className="mt-2 text-base font-semibold text-base-content">{step.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={
                  'h-1.5 w-1.5 rounded-full transition-colors ' +
                  (i === index ? 'bg-primary' : 'bg-base-300')
                }
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button type="button" onClick={prev} className="btn btn-ghost btn-sm gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            )}
            <button type="button" onClick={next} className="btn btn-primary btn-sm gap-1">
              {isLast ? 'Concluir' : 'Próximo'}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
