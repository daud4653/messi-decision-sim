"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state">
      <h1>PLAY PAUSED.</h1>
      <p>
        The dataset could not be loaded. Check the server connection and try
        again.
      </p>
      <button className="button primary" onClick={reset}>
        TRY AGAIN
      </button>
    </main>
  );
}
