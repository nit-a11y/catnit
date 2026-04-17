import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '🐱 Gato Gladiador Mágico',
  description: 'Desafie o coliseu neste RPG de sobrevivência felino!',
  manifest: '/manifest.json',
  themeColor: '#1a1423',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GatoGladiador',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
