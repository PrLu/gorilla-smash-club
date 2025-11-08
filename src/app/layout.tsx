import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AppearanceProvider } from '@/lib/AppearanceProvider';
import { Toast } from '@/components/ui';
import { Header } from '@/components/Header';

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Gorilla Smash Club - The Beast Mode of Pickleball',
  description: 'Manage and participate in pickleball tournaments with real-time updates, automatic fixtures generation, and seamless player management.',
  keywords: ['pickleball', 'tournament', 'sports', 'management', 'gorilla smash club'],
  authors: [{ name: 'Gorilla Smash Club' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#03045e',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100`}>
        <ReactQueryProvider>
          <AppearanceProvider>
            <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toast />
          </AppearanceProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
