import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppQueryProvider } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth/auth-context';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ordo — Conciliação Bancária Inteligente',
  description: 'Plataforma de conciliação bancária, classificação e DFC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="concilia" className={plusJakartaSans.variable}>
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
