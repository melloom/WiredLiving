/**
 * Content validation panel component
 * Shows validation issues, warnings, and suggestions in the admin dashboard
 */

import React from 'react';

interface ValidationIssue {
  type: 'critical' | 'error';
  message: string;
  location?: string;
}

interface ValidationWarning {
  type: 'warning';
  message: string;
  suggestion: string;
}

export interface ContentValidationPanelProps {
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  isExpanded?: boolean;
}

export function ContentValidationPanel({
  issues,
  warnings,
  isExpanded = false,
}: ContentValidationPanelProps) {
  const hasProblems = issues.length > 0 || warnings.length > 0;

  if (!hasProblems) {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <span className="text-lg">✅</span>
          <span className="font-medium">Content looks great!</span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Your blog post follows best practices for structure and SEO.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-4 space-y-3">
      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <span>🚨</span>
            Issues to Fix ({issues.length})
          </h4>
          <ul className="space-y-1 text-xs">
            {issues.map((issue, idx) => (
              <li key={idx} className="text-red-600 dark:text-red-400 flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <span>⚠️</span>
            Suggestions ({warnings.length})
          </h4>
          <ul className="space-y-2 text-xs">
            {warnings.map((warning, idx) => (
              <li key={idx} className="bg-white dark:bg-gray-800/50 rounded p-2 space-y-1">
                <div className="text-yellow-600 dark:text-yellow-400 font-medium">{warning.message}</div>
                <div className="text-gray-600 dark:text-gray-400">💡 {warning.suggestion}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Tips */}
      <div className="border-t border-yellow-200 dark:border-yellow-800 pt-2 mt-2">
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          💡 Tip: Blog posts with proper structure, single H1, and quality content tend to rank better.
        </p>
      </div>
    </div>
  );
}
