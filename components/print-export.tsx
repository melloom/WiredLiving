'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

interface PrintExportProps {
  postTitle: string;
  postSlug: string;
}

export function PrintExport({ postTitle, postSlug }: PrintExportProps) {
  const toast = useToast();
  const [showOptions, setShowOptions] = useState(false);

  const handlePrint = () => {
    // Add print class to body for additional styling control
    document.body.classList.add('is-printing');

    // Trigger print dialog (user can choose to print or save as PDF)
    window.print();

    // Remove print class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove('is-printing');
    }, 100);
  };

  const handlePrintWithOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium no-print"
          aria-label="Print or save as PDF"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          <span>Print / Save PDF</span>
        </button>

        <button
          onClick={handlePrintWithOptions}
          className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors no-print"
          aria-label="Print options"
          title="Print tips"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-10 no-print">
          <h3 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
            Print/PDF Tips
          </h3>
          <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>In the print dialog, select your <strong>printer</strong> to print directly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Or select <strong>"Save as PDF"</strong> as the destination to save a digital copy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>For best results, enable <strong>"Remove headers and footers"</strong> in print settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Choose <strong>A4 or Letter</strong> page size</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Portrait orientation recommended for most posts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Background graphics are hidden for cleaner printing</span>
            </li>
          </ul>
          <button
            onClick={() => setShowOptions(false)}
            className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
