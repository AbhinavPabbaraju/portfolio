import { ImageResponse } from "next/og";

/* The share card. Painted from the same tokens as the page — near-black,
   the steel sector glow, mono labels — so a pasted link looks like the site
   it opens. No webfonts: ImageResponse would have to fetch them at build
   time, and the default face holds the layout fine at this size. */

export const alt = "Abhinav Pabbaraju — systems engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0c141b";
const TEXT = "#e8eef1";
const MUTED = "#9fb3bd";
const DIM = "#7b94a1";
const ACCENT = "#5b93b3";
const LIVE = "#86b0a6";
const LINE = "#22384a";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", background: BG, padding: 72,
          backgroundImage:
            `radial-gradient(900px 460px at 88% -8%, rgba(91,147,179,.20), transparent 60%),` +
            `radial-gradient(700px 400px at -8% 108%, rgba(134,176,166,.10), transparent 60%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: MUTED, fontSize: 22, letterSpacing: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: LIVE }} />
          SYSTEMS ENGINEER · LOW-LATENCY · DISTRIBUTED
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 116, fontWeight: 700, color: TEXT, letterSpacing: -3, lineHeight: 1.02 }}>
            Abhinav
          </div>
          <div style={{ display: "flex", fontSize: 116, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>
            <span style={{ color: TEXT }}>Pabba</span>
            <span style={{ color: ACCENT }}>raju</span>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: MUTED, maxWidth: 900, lineHeight: 1.4 }}>
            I work where correctness and speed fight each other — consensus, compiler
            backends, GPU physics, order books.
          </div>
        </div>

        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: `1px solid ${LINE}`, paddingTop: 26, fontSize: 24, color: DIM, letterSpacing: 2,
          }}
        >
          <div style={{ display: "flex" }}>PHALANX · RICC · AVE · PENUMBRA · F1 2026</div>
          <div style={{ display: "flex", color: MUTED }}>abhinavpabbaraju.com</div>
        </div>
      </div>
    ),
    size,
  );
}
