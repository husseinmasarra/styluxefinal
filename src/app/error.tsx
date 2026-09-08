'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-xl font-extrabold tracking-prada text-zinc-950 uppercase">
        SOMETHING WENT WRONG
      </h2>
      <p className="text-xs text-zinc-500 max-w-md">
        An error occurred while loading this page. Please try refreshing or return to homepage.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 border border-zinc-300 text-zinc-900 text-xs font-bold uppercase tracking-widest"
        >
          GO TO HOMEPAGE
        </Link>
      </div>
    </div>
  );
}
