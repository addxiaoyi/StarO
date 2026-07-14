"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Application error:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          页面出现了一些问题
        </h2>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          请稍后再试，或者联系管理员并提供错误编号 {error.digest?.slice(0, 8)}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
          >
            重试
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
          >
            返回首页
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
              开发者信息
            </summary>
            <pre className="mt-2 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-xs overflow-auto max-h-48 text-red-600 dark:text-red-400">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
