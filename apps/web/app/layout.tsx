import type { Metadata } from 'next';
import './globals.css';
import { AppQueryProvider } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth/auth-context';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Conciliação Bancária Inteligente',
  description: 'Plataforma de conciliação bancária, classificação e DFC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="concilia">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AppQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
