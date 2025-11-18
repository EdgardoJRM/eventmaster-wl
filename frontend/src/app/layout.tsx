import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AmplifyProvider } from '@/components/AmplifyProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EventMaster - Gestión de Eventos',
  description: 'Plataforma White Label para gestión y control de eventos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Unregister any existing service workers
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AmplifyProvider>
            {children}
          </AmplifyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

