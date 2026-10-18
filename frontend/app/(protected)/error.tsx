'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  // Deliberately no console output and no error.message shown to the user.
  return (
    <div className="flex flex-col items-start gap-3">
      <p>Something went wrong.</p>
      <button onClick={reset} className="underline">Try again</button>
    </div>
  );
}