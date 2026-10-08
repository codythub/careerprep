"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>Please try again. If the problem continues, contact support.</p>
        {error.digest && <p style={{ color: "#94a3b8", fontSize: 12 }}>Reference: {error.digest}</p>}
        <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 16px" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
