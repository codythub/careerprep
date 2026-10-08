import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
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
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
          borderTop: "16px solid #0b5d3b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: "#0b5d3b" }}>{siteConfig.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, color: "#0f172a", lineHeight: 1.05 }}>{siteConfig.tagline}</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#475569", maxWidth: 980 }}>
            Resume optimization, remote jobs and career guidance for Nigerian professionals.
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#64748b" }}>{siteConfig.brandMessage}</div>
      </div>
    ),
    size,
  );
}
