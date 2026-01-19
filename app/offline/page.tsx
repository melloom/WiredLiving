'use client';

export default function Offline() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          It looks like you&apos;re not connected to the internet. Some features may be unavailable.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Your previously visited pages may still be available.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
