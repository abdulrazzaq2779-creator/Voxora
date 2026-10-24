import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vervue AI — Better interviews. Clearer insights.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "linear-gradient(135deg, #15182c 0%, #232743 55%, #2e2450 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #6c5cf6, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, display: "flex" }}>
            Vervue AI
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Better interviews.</span>
          <span
            style={{
              background: "linear-gradient(90deg, #a5b4fc, #e9d5ff)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Clearer insights.
          </span>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: "rgba(255,255,255,0.72)",
            display: "flex",
          }}
        >
          Structured video interviews with AI-assisted review — in one workspace.
        </div>
      </div>
    ),
    size
  );
}
