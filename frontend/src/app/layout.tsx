import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SupportDesk CRM — Customer Support Ticketing System',
  description: 'Professional customer support management system with ticket tracking, team collaboration, analytics, and multi-channel communication powered by Google Sheets.',
  keywords: ['CRM', 'Customer Support', 'Ticketing System', 'Help Desk', 'Support Desk'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
