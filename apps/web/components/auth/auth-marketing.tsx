'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Building2,
  Landmark,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';

const HERO_HEADLINES: [string, string][] = [
  ['Visualize o fluxo de', 'caixa da sua empresa.'],
  ['Controle suas', 'entradas e saídas.'],
  ['Automatize a classificação', 'dos lançamentos.'],
  ['Tome decisões com', 'relatórios prontos.'],
];

function RotatingHeadline() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_HEADLINES.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const [line1, line2] = HERO_HEADLINES[index];

  return (
    <h1
      key={index}
      className="hero-headline-slide font-serif text-4xl font-bold leading-[1.1] tracking-tight text-base-content sm:text-5xl"
    >
      {line1}
      <br /> <span className="text-primary">{line2}</span>
    </h1>
  );
}

const TRUST_ITEMS = ['Conciliação automática', 'Sem planilhas manuais'];

const ROADMAP = [
  'IA de sugestão por similaridade',
  'Import de XLSX',
  'RBAC completo por empresa',
  'Auditoria e versionamento',
  'Centro de custo e projeto',
  'Conexão com Power BI',
];

function Reveal({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`reveal-wipe scroll-mt-24 ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl shadow-black/15">
      <div className="flex items-center gap-1.5 border-b border-base-300 bg-base-200 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ImportMockup() {
  return (
    <MockupFrame>
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-base-300 bg-base-200/50 px-6 py-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileUp className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-base-content">extrato_agosto.ofx</p>
        <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-base-300">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>
        <div className="flex gap-4 text-xs">
          <span className="font-semibold text-success">128 importados</span>
          <span className="text-muted-foreground">4 duplicados ignorados</span>
        </div>
      </div>
    </MockupFrame>
  );
}

const RULES = [
  { cond: "descrição contém 'ENERGISA'", cat: 'Utilidades › Energia' },
  { cond: "descrição contém 'FOLHA'", cat: 'Pessoal › Salários' },
  { cond: "descrição contém 'PIX RECEBIDO'", cat: 'Receitas › Vendas' },
];

function RulesMockup() {
  return (
    <MockupFrame>
      <div className="space-y-2">
        {RULES.map((r) => (
          <div
            key={r.cond}
            className="flex items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-200/40 px-3 py-2.5 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate text-base-content/70">SE {r.cond}</p>
              <p className="mt-0.5 truncate font-medium text-base-content">→ {r.cat}</p>
            </div>
            <span className="badge badge-success badge-sm shrink-0 text-success-content">Ativa</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const GRID_ROWS = [
  { date: '12/08', desc: 'ENERGISA DISTRIB.', cat: 'Energia', value: '-R$ 842,10' },
  { date: '12/08', desc: 'PIX RECEBIDO - CLIENTE X', cat: 'Vendas', value: '+R$ 3.200,00' },
  { date: '13/08', desc: 'TARIFA MANUTENÇÃO CC', cat: '—', value: '-R$ 29,90' },
];

function GridMockup() {
  return (
    <MockupFrame>
      <div className="overflow-hidden rounded-lg border border-base-300">
        <table className="w-full text-xs">
          <thead className="bg-base-200 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Data</th>
              <th className="px-3 py-2 text-left font-medium">Descrição</th>
              <th className="px-3 py-2 text-left font-medium">Categoria</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {GRID_ROWS.map((r) => (
              <tr key={r.desc}>
                <td className="px-3 py-2 text-muted-foreground">{r.date}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-base-content">{r.desc}</td>
                <td className="px-3 py-2">
                  {r.cat === '—' ? (
                    <span className="badge badge-outline badge-sm">pendente</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">{r.cat}</span>
                  )}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    r.value.startsWith('+') ? 'text-success' : 'text-base-content'
                  }`}
                >
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupFrame>
  );
}

const DFC_ROWS = [
  { label: 'Operacional', values: ['12.400', '9.850', '14.220'], bold: true },
  { label: 'Recebimentos de clientes', values: ['18.900', '15.200', '21.000'], bold: false },
  { label: 'Pagamentos a fornecedores', values: ['-6.500', '-5.350', '-6.780'], bold: false },
  { label: 'Investimento', values: ['-2.100', '0', '-800'], bold: true },
  { label: 'Financiamento', values: ['-1.200', '-1.200', '-1.200'], bold: true },
];

function DfcMockup() {
  return (
    <MockupFrame>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Linha</th>
              <th className="px-2 py-1.5 text-right font-medium">Jun</th>
              <th className="px-2 py-1.5 text-right font-medium">Jul</th>
              <th className="px-2 py-1.5 text-right font-medium">Ago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {DFC_ROWS.map((r) => (
              <tr key={r.label}>
                <td
                  className={`px-2 py-1.5 ${
                    r.bold ? 'font-semibold text-base-content' : 'pl-4 text-muted-foreground'
                  }`}
                >
                  {r.label}
                </td>
                {r.values.map((v, i) => (
                  <td
                    key={i}
                    className={`px-2 py-1.5 text-right ${r.bold ? 'font-semibold' : ''} ${
                      v.startsWith('-') ? 'text-destructive' : 'text-base-content'
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupFrame>
  );
}

function DashboardMockup() {
  const bars = [40, 65, 50, 80, 55, 90, 70];
  return (
    <MockupFrame>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-base-300 bg-base-200/40 p-2.5">
          <p className="text-[10px] text-muted-foreground">Entradas</p>
          <p className="text-sm font-semibold text-success">R$ 42,1k</p>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-200/40 p-2.5">
          <p className="text-[10px] text-muted-foreground">Saídas</p>
          <p className="text-sm font-semibold text-destructive">R$ 28,4k</p>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-200/40 p-2.5">
          <p className="text-[10px] text-muted-foreground">Saldo</p>
          <p className="text-sm font-semibold text-primary">R$ 13,7k</p>
        </div>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5 rounded-lg border border-base-300 bg-base-200/30 p-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
        ))}
      </div>
    </MockupFrame>
  );
}

function CadastrosMockup() {
  return (
    <MockupFrame>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center gap-2 font-semibold text-base-content">
          <Building2 className="h-3.5 w-3.5 text-primary" /> Minha Empresa LTDA
        </div>
        <div className="ml-5 space-y-1.5 border-l border-base-300 pl-3">
          <div className="flex items-center gap-2 text-base-content/80">
            <Landmark className="h-3.5 w-3.5 text-secondary" /> Banco XXX · CC 12345-6
          </div>
          <div className="flex items-center gap-2 text-base-content/80">
            <Landmark className="h-3.5 w-3.5 text-secondary" /> Banco YYY · CC 98765-4
          </div>
        </div>
        <div className="ml-5 flex flex-wrap gap-1.5 border-l border-base-300 pl-3">
          {['Receitas', 'Pessoal', 'Utilidades', 'Impostos', 'Investimentos'].map((c) => (
            <span key={c} className="badge badge-ghost badge-sm">
              {c}
            </span>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  reverse,
  mockup,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  reverse?: boolean;
  mockup: React.ReactNode;
}) {
  return (
    <Reveal id={id} className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </span>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">{title}</h3>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
        <ul className="mt-5 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-base-content/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>{mockup}</div>
    </Reveal>
  );
}

function RoadmapSection() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function syncFromHash() {
      if (window.location.hash === '#roadmap') setOpen(true);
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  return (
    <Reveal id="roadmap" className="py-16">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
          Roadmap
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mx-auto mt-4 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-base-content transition-colors hover:text-primary sm:text-3xl"
        >
          O que vem por aí
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          O MVP já resolve o essencial da conciliação. Clique acima para ver o que vem nas próximas
          fases.
        </p>
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {ROADMAP.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span className="text-sm text-base-content">{item}</span>
                <span className="badge badge-outline badge-sm shrink-0">Em breve</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

const BALANCE_BARS = [30, 38, 34, 46, 40, 55, 50, 62, 56, 68, 78];

function FinancialPictureCard() {
  return (
    <div className="relative mx-auto max-w-md pb-8 pt-6 lg:mx-0">
      <div className="absolute -top-2 right-2 z-20 flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-xl shadow-black/5">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <div>
          <p className="text-[11px] text-muted-foreground">Saldo total</p>
          <p className="text-sm font-bold text-base-content">
            R$ 248.430,00 <span className="font-semibold text-primary">+18,4%</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl shadow-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seu fluxo de caixa
        </p>
        <p className="mt-1 text-lg font-bold text-base-content">Atualizado a cada importação</p>

        <div className="mt-5 rounded-2xl bg-base-200/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Saldo do período</p>
            <span className="badge badge-success badge-sm gap-1 text-success-content">
              <ArrowUpRight className="h-3 w-3" /> 12,8%
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-base-content">R$ 82.460,12</p>

          <div className="mt-4 flex h-24 items-end gap-1.5">
            {BALANCE_BARS.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t ${
                  i === BALANCE_BARS.length - 1 ? 'bg-primary' : 'bg-primary/20'
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Jan</span>
            <span>Mai</span>
            <span>Set</span>
            <span>Nov</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-base-300 p-2.5">
            <p className="text-[10px] text-muted-foreground">Entradas</p>
            <p className="text-sm font-semibold text-success">R$ 42,1k</p>
            <div className="mt-1.5 h-1 rounded-full bg-base-300">
              <div className="h-1 w-3/4 rounded-full bg-success" />
            </div>
          </div>
          <div className="rounded-xl border border-base-300 p-2.5">
            <p className="text-[10px] text-muted-foreground">Saídas</p>
            <p className="text-sm font-semibold text-destructive">R$ 28,4k</p>
            <div className="mt-1.5 h-1 rounded-full bg-base-300">
              <div className="h-1 w-1/2 rounded-full bg-destructive" />
            </div>
          </div>
          <div className="rounded-xl border border-base-300 p-2.5">
            <p className="text-[10px] text-muted-foreground">Conciliado</p>
            <p className="text-sm font-semibold text-primary">92%</p>
            <div className="mt-1.5 h-1 rounded-full bg-base-300">
              <div className="h-1 w-[92%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-2 left-1/2 z-20 flex w-[87%] -translate-x-1/2 items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-secondary-content shadow-xl shadow-black/10">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-content/15">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs text-secondary-content/70">Dados protegidos</p>
          <p className="text-sm font-semibold">Seus dados são só seus</p>
        </div>
      </div>
    </div>
  );
}

export function AuthMarketing({ onOpenAuth }: { onOpenAuth: () => void }) {
  const pathname = usePathname();
  const isRegister = pathname === '/register';
  const ctaLabel = isRegister ? 'Criar minha conta' : 'Entrar agora';

  return (
    <main>
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-gradient-to-b from-primary/25 via-primary/15 to-primary/10 px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Conciliação, com clareza
            </span>

            <div className="mt-5">
              <RotatingHeadline />
            </div>

            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              Importe extratos, classifique automaticamente e acompanhe a DFC da sua empresa — tudo
              em um só lugar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn btn-primary gap-2 rounded-full px-6"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#funcionalidades"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-base-content hover:text-primary"
              >
                Ver funcionalidades
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
              {TRUST_ITEMS.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <FinancialPictureCard />
        </div>
      </section>

      <section
        id="funcionalidades"
        className="mx-auto max-w-6xl scroll-mt-20 divide-y divide-base-300 px-4 sm:px-6"
      >
        <FeatureSection
          id="importacao"
          eyebrow="Importação"
          title="Solte o extrato, o resto é automático"
          description="Extrato importado, lançamentos prontos na hora."
          bullets={[
            'Detecção automática de colunas no CSV',
            'Dedupe por hash da transação + FitID do OFX',
            'Split automático por competência',
          ]}
          mockup={<ImportMockup />}
        />
        <FeatureSection
          id="classificacao"
          eyebrow="Classificação"
          title="Regras que classificam sua rotina financeira"
          description="Regras classificam cada lançamento sozinhas."
          bullets={[
            'Prioridade configurável entre regras',
            'Aplicação automática logo após o import',
            '"Reaplicar em pendentes" sob demanda',
          ]}
          reverse
          mockup={<RulesMockup />}
        />
        <FeatureSection
          id="grid"
          eyebrow="Conciliação"
          title="Uma grid pensada pra revisar rápido"
          description="Revise e concilie tudo numa única tela."
          bullets={[
            'Filtros por período, conta, categoria e status',
            'Ações em lote para reclassificar em massa',
            'Export para CSV/Excel',
          ]}
          mockup={<GridMockup />}
        />
        <FeatureSection
          id="dfc"
          eyebrow="Relatórios"
          title="DFC pronta, sem planilha"
          description="Seu fluxo de caixa, montado automaticamente."
          bullets={[
            'Estrutura contábil já organizada',
            'Categoria-folha mapeada direto pra linha do DFC',
            'Export CSV/Excel com um clique',
          ]}
          reverse
          mockup={<DfcMockup />}
        />
        <FeatureSection
          id="dashboard"
          eyebrow="Visão executiva"
          title="Seu caixa em gráficos, atualizado a cada import"
          description="Seu caixa em números, sempre atualizado."
          bullets={[
            'Entradas, saídas e saldo do período',
            'Fluxo mensal e saldo acumulado',
            'Top categorias por volume',
          ]}
          mockup={<DashboardMockup />}
        />
        <FeatureSection
          id="cadastros"
          eyebrow="Organização"
          title="Empresas, contas e categorias no seu jeito"
          description="Empresas, contas e categorias, do seu jeito."
          bullets={[
            'Várias empresas e contas bancárias',
            'Categorias hierárquicas (grupo → seção → linha)',
            'Fornecedores e clientes cadastrados',
          ]}
          reverse
          mockup={<CadastrosMockup />}
        />
      </section>

      <section className="bg-base-200/50 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <RoadmapSection />
        </div>
      </section>

      <section className="bg-[hsl(175,84%,13%)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-content/15 text-primary-content">
              <BarChart3 className="h-5 w-5" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-teal-300">
              Conciliação bancária inteligente
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-primary-content sm:text-3xl">
              Pronto pra organizar seu fluxo de caixa?
            </h3>
            <p className="mt-3 max-w-md text-sm text-primary-content/70">
              Importe seu primeiro extrato e veja os lançamentos classificados na hora.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn mt-6 gap-2 rounded-full border-none bg-base-100 px-6 text-base-content hover:bg-base-100/90"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-primary-content/10 bg-primary-content/5 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-content/60">
                Este mês
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-content/15 text-primary-content">
                <Check className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-primary-content">128 lançamentos importados</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary-content/10 p-3">
                <p className="text-[11px] text-primary-content/60">Ritmo mensal</p>
                <p className="mt-1 text-sm font-semibold text-primary-content">Em dia</p>
              </div>
              <div className="rounded-xl bg-primary-content/10 p-3">
                <p className="text-[11px] text-primary-content/60">Duplicados ignorados</p>
                <p className="mt-1 text-sm font-semibold text-primary-content">4</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-base-100 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        Ordo · Conciliação Bancária Inteligente · Fase 1 — MVP
      </footer>
    </main>
  );
}
