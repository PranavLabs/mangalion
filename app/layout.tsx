import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 1. SEO OPTIMIZATION
export const metadata: Metadata = {
  title: {
    default: 'KOMIK - Read Manga, Manhwa & Webtoons Online Free',
    template: '%s | KOMIK',
  },
  description: 'Read your favorite Japanese Manga, Korean Manhwa, and Chinese Manhua for free on KOMIK. The best alternative to MangaDex, MangaNato, Asura Scans, and MangaKakalot. High-quality images, fast loading, and no ads.',
  keywords: [
    'Read Manga Online', 'Free Manga', 'MangaDex Alternative', 'MangaNato', 'MangaKakalot', 
    'Asura Scans', 'Flame Scans', 'Reaper Scans', 'Webtoons', 'Manhwa', 'Manhua', 
    'KOMIK', 'Solo Leveling', 'One Piece', 'Jujutsu Kaisen'
  ],
  openGraph: {
    title: 'KOMIK - The Ultimate Manga Reader',
    description: 'Read Manga, Manhwa, and Webtoons for free with no interruptions.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f0f11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f0f11] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
