import { PAL, rasterise } from "@/lib/library/pixel";

/** Draw a character-map sprite at a position on the logical grid.
 *
 *  The map is the picture: one character per pixel, `.` for transparent, any
 *  other character a key into the palette. `rasterise` collapses it into the
 *  fewest rectangles that reproduce it exactly, so a sprite costs roughly its
 *  number of *shapes* rather than its number of pixels. */
export default function Px({
  art, x = 0, y = 0, pal = PAL, opacity,
}: {
  art: string[]; x?: number; y?: number; pal?: Record<string, string>; opacity?: number;
}) {
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      {rasterise(art, pal).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </g>
  );
}

/** A flat block. Most of a room is flat blocks, and writing them as sprites
 *  would be a character map the size of a wall. */
export function Box({
  x, y, w, h, c, opacity,
}: { x: number; y: number; w: number; h: number; c: keyof typeof PAL; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={PAL[c]} opacity={opacity} />;
}
