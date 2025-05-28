import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <main className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          CityStep
        </h1>

        <p className="mb-8 text-xl text-gray-600 md:text-2xl">
          Составляйте оптимальные маршруты по интересным и красивым местам города
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/create-route"
            className="rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Создать маршрут
          </Link>

          <Link
            href="/saved-routes"
            className="rounded-md bg-gray-200 px-6 py-3 text-gray-800 transition-colors hover:bg-gray-300"
          >
            Мои маршруты
          </Link>

          <Link
            href="/moscow-places"
            className="rounded-md bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
          >
            Места Москвы
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold">Удобное планирование</h2>
            <p className="text-gray-600">Укажите начальную и конечную точки, время и предпочтения для идеального маршрута</p>
          </div>

          <Link href="/moscow-places/beautiful" className="rounded-lg bg-white p-6 shadow-md block hover:shadow-lg transition-shadow">
            <h2 className="mb-3 text-xl font-semibold text-green-700">Красивые места</h2>
            <p className="text-gray-600">Исследуйте самые красивые и впечатляющие достопримечательности Москвы с нашим анализом</p>
          </Link>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold">Пошаговая навигация</h2>
            <p className="text-gray-600">Следуйте маршруту с подробными инструкциями и информацией о каждой точке</p>
          </div>
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>© 2025 CityStep - Ваш путеводитель по городу</p>
      </footer>
    </div>
  );
}
