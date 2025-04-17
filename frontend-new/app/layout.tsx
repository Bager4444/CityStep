import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import dynamic from "next/dynamic";

// Динамический импорт компонента меню пользователя
const UserMenu = dynamic(() => import('@/components/auth/UserMenu'), {
  ssr: false,
  loading: () => <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CityStep - Маршруты для туристов",
  description: "Составляйте оптимальные маршруты по интересным и красивым местам города",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              CityStep
            </Link>
            <div className="flex items-center space-x-6">
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <Link href="/create-route" className="text-gray-600 hover:text-green-600 transition-colors">
                      Создать маршрут
                    </Link>
                  </li>
                  <li>
                    <Link href="/saved-routes" className="text-gray-600 hover:text-green-600 transition-colors">
                      Мои маршруты
                    </Link>
                  </li>
                </ul>
              </nav>
              <UserMenu />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
