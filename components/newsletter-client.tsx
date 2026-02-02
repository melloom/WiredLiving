'use client';

import { useState } from 'react';
import { siteConfig } from '@/config/site';

export function NewsletterClient() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      // In a real implementation, you would send this to your email service
      // (e.g., Mailchimp, ConvertKit, SendGrid, etc.)
      // For now, we'll just simulate a successful subscription
      
      // Example API call:
      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, name }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      setMessage('Thank you for subscribing! Check your email to confirm your subscription.');
      setEmail('');
      setName('');
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  Stay Updated
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Newsletter
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Get notified about new posts, tutorials, and updates. No spam, unsubscribe anytime.
            </p>
          </div>

          {/* Subscription Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-lg">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  You&apos;re subscribed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {message}
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Subscribe Another Email
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                  Subscribe to {siteConfig.name}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Name (Optional)
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {message && (
                    <div
                      className={`p-4 rounded-lg ${
                        status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {message}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Subscribing...
                      </span>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </form>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    🔒 We respect your privacy. Unsubscribe at any time.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Benefits */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">📬</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Weekly Updates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when new posts are published
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Exclusive Content
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access to special content and early previews
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-3">🚫</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                No Spam
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only valuable content, unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

