'use client'

import Link from "next/link";
import dynamic from "next/dynamic";

// Динамический импорт компонента меню пользователя
const UserMenu = dynamic(() => import('@/components/auth/UserMenu'), {
  ssr: false,
  loading: () => <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
                <li>
                  <Link href="/moscow-places" className="text-gray-600 hover:text-green-600 transition-colors">
                    Места Москвы
                  </Link>
                </li>
              </ul>
            </nav>
            <UserMenu />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
