import { Outfit } from 'next/font/google';
import { AuthProvider } from '@/lib/context/AuthContext';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'ToolTrunk - Neighbor-to-Neighbor Tool Sharing',
  description: 'Rent or lend tools in your local community. Save money, reduce waste, and build neighborhood trust on ToolTrunk.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧰</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={`${outfit.className} bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-500 selection:text-white min-h-screen pb-16 sm:pb-0`}>
        <AuthProvider>
          {children}
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
