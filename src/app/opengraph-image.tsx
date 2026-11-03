import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { formatEvent } from "@/lib/event-format";
import { requireEvent } from "@/server/context";

export const alt = "Thanksgiving at Andrew and Isabella's. Say you're coming and pick what to bring.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  const [ev, font] = await Promise.all([
    requireEvent(),
    readFile(join(process.cwd(), "assets/YoungSerif-Regular.ttf")),
  ]);
  const { date, time } = formatEvent(ev.startsAt);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#E8E4DC",
          padding: 72,
          color: "#2B2A26",
          fontFamily: "Young Serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "#2F4F3A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 66, height: 66, borderRadius: 33, background: "#FBFAF6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: "#F1E4C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: "#7A5214" }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, lineHeight: 1.08, display: "flex" }}>{ev.title}</div>
          <div style={{ fontSize: 40, color: "#5E5B53", marginTop: 28, display: "flex" }}>
            {date} at {time}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: "#2F4F3A",
            color: "#FBFAF6",
            fontSize: 36,
            padding: "18px 36px",
            borderRadius: 18,
          }}
        >
          I&apos;m coming
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Young Serif", data: font, style: "normal", weight: 400 }] },
  );
}
