import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="py-2 sm:py-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-1.5">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {siteConfig.name}
                </span>
              </Link>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug max-w-xs">
                {siteConfig.tagline}
              </p>
            </div>

            {/* Navigation Links (shortened) */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">
                Navigation
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Home</Link>
                </li>
                <li>
                  <Link href="/blog" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Blog</Link>
                </li>
                <li>
                  <Link href="/about" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">About</Link>
                </li>
                <li>
                  <Link href="/contact" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Contact</Link>
                </li>
              </ul>
            </div>

            {/* Social/Resources (shortened) */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Social</h3>
              <ul className="space-y-1">
                {siteConfig.links.portfolio && (
                  <li>
                    <a href={siteConfig.links.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Portfolio</a>
                  </li>
                )}
                {siteConfig.links.socialHub && (
                  <li>
                    <a href={siteConfig.links.socialHub} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Social Hub</a>
                  </li>
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/terms" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Terms</Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">Privacy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200/80 dark:border-gray-800/80 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} {siteConfig.author.name || siteConfig.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/terms" className="text-xs text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">Terms</Link>
              <Link href="/privacy" className="text-xs text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

