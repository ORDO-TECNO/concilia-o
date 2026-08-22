import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECTIONS = [
  { href: '/cadastros/empresas', title: 'Empresas', description: 'Empresas cadastradas e vínculo com seu usuário' },
  { href: '/cadastros/contas', title: 'Contas bancárias', description: 'Bancos, agências e contas da empresa atual' },
  { href: '/cadastros/categorias', title: 'Categorias', description: 'Plano de categorias e mapeamento com o DFC' },
  { href: '/cadastros/fornecedores', title: 'Fornecedores e clientes', description: 'Cadastro de favorecidos' },
];

export default function CadastrosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Cadastros</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="text-foreground">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
