import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Acces refuse</h1>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Vous n&apos;avez pas les permissions necessaires pour acceder a cette page.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Retour au dashboard
        </Link>
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Aller a l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
