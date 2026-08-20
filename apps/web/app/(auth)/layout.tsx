import { ShieldCheck, TrendingUp, FileBarChart2 } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Conciliação automática',
    desc: 'Importe CSV/OFX e deixe as regras classificarem os lançamentos por você.',
  },
  {
    icon: TrendingUp,
    title: 'Visão clara do caixa',
    desc: 'Dashboards e DFC atualizados a cada importação, sem planilhas manuais.',
  },
  {
    icon: FileBarChart2,
    title: 'Relatórios prontos para decisão',
    desc: 'Exporte a DFC em CSV/Excel com a estrutura contábil já organizada.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-10">
      {/* base field */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/10 to-primary/60" />

      {/* drifting glow blobs */}
      <div className="animate-blob-a pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/40 blur-[110px]" />
      <div className="animate-blob-b pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-secondary/50 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="w-full max-w-lg text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-content/25 bg-primary-content/10 px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-primary-content backdrop-blur-sm">
            // conciliação bancária
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-primary-content sm:text-5xl">
            Descubra quando seu
            <br className="hidden sm:block" /> caixa fica no azul.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-primary-content/80 lg:mx-0">
            Importe extratos, classifique automaticamente e acompanhe a DFC da sua empresa —
            tudo em um só lugar.
          </p>

          <div className="mt-8 hidden flex-col gap-3 lg:flex">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="flex items-center gap-3 rounded-2xl border border-primary-content/15 bg-primary-content/5 px-4 py-3 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-content/15 text-primary-content">
                  <h.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary-content">{h.title}</p>
                  <p className="text-xs text-primary-content/65">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0">{children}</div>
      </div>
    </div>
  );
}
