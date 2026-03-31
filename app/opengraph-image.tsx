import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background:
            "radial-gradient(circle at top, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 70%)",
          color: "#e2e8f0",
          fontFamily: "Arial",
        }}
      >
        <p style={{ fontSize: 30, color: "#22d3ee", marginBottom: "12px" }}>
          Tree of Savior Mobile
        </p>
        <h1 style={{ fontSize: 66, margin: 0, lineHeight: 1.1 }}>
          Damage Calculator
        </h1>
        <p style={{ fontSize: 30, marginTop: "20px", color: "#94a3b8" }}>
          Dynamic multipliers. Formula breakdown. Public access.
        </p>
      </div>
    ),
    size,
  );
}
