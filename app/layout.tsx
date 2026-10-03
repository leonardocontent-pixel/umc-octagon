import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './styles.css';
export const metadata: Metadata = {
  title: 'UMC — Ultimate Menfe Championship',
  description: 'Temporada UMC 2026 · Entre no octagon, monte seu fighter e dispute o cinturão.',
  applicationName: 'UMC Octagon',
  themeColor: '#090a0b',
};
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
