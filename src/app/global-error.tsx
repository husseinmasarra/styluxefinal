'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-950 min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-extrabold tracking-widest uppercase">
          STYLUXE GLOBAL ERROR
        </h2>
        <p className="text-xs text-zinc-500">
          A critical error occurred. Click below to reload.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest"
        >
          RELOAD APP
        </button>
      </body>
    </html>
  );
}
