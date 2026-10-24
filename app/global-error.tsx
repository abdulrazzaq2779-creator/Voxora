"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#f7f8fc",
          color: "#171a2b",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>
            Vervue AI hit an unexpected error
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, color: "#5d6478", lineHeight: 1.6 }}>
            This prototype failed to render. Reloading usually fixes it — no
            data is stored anywhere, so nothing was lost.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 12,
              border: 0,
              background: "#5b4cf4",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}
