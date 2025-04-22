import '@/app/ui/global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Map Dashboard',
  description: 'Interactive map of cities and roads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
