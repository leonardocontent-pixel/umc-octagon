import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './styles.css';
export const metadata: Metadata = { title: 'UMC — Ultimate Menfe Championship', description: 'Octagon comercial Menfe · Outubro 2026' };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
