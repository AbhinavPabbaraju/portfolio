/** Engraved ornament flanking the paper menu.
 *
 *  The menu is 820px of warm paper in the middle of a very wide dark room,
 *  and the margins either side of it were dead space — no light, no material,
 *  nothing to say the room continues. This is a pilaster: finial, crest,
 *  acanthus wings, a rod, a palmette at the waist, and the whole thing again
 *  upside down at the foot. Two of them, one per margin.
 *
 *  Built as three pieces stacked in a flex column rather than one tall SVG,
 *  because the menu's height is whatever five dishes come to: a single
 *  drawing stretched to that would either distort or letterbox. The caps keep
 *  their aspect, the rod between them takes up the slack, and the palmette
 *  rides the middle wherever the middle happens to be.
 *
 *  Every stroke is `non-scaling-stroke`. Line art of this kind is hairline at
 *  any size — that is what makes it read as engraving rather than as a shape
 *  — and without it the weight would swing with the viewport.
 */

/** One acanthus blade, stem at the local origin, sweeping left and down.
 *
 *  Drawn once and placed by transform, because a single blade reads as a
 *  leaf and three overlapping at different sizes and angles read as a
 *  flourish. That layering is the whole difference between this and a
 *  diagram: baroque ornament has no gaps, it has depth. Rotation is about
 *  the stem, so a blade always turns the way a blade would grow. */
function Leaf({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <path d="M0,4 C-16,-6 -38,-8 -56,0 C-48,6 -42,12 -38,20
               C-52,16 -68,18 -80,28 C-69,31 -61,36 -55,44
               C-68,46 -80,54 -87,68 C-74,64 -62,64 -51,68
               C-58,78 -61,90 -60,102 C-52,90 -42,80 -30,72
               C-18,64 -8,48 -4,30 C-2,20 -1,11 0,4 Z" />
      <path d="M-4,11 C-22,11 -44,19 -60,33" />
      <path d="M-8,25 C-26,31 -44,43 -56,59" />
    </g>
  );
}

/** A volute — the curl an acanthus tip makes when it runs out of blade. */
function Curl({ transform }: { transform?: string }) {
  return (
    <path transform={transform}
          d="M0,0 C-7,8 -10,18 -6,26 C-2,33 8,33 11,25 C13,19 9,14 4,16" />
  );
}

/** One half of a symmetrical cap: crest scroll, three-blade wing, its curl.
 *  Drawn pointing left and mirrored for the other side, so the two halves
 *  cannot drift apart. A React component rather than `<use href>`: this
 *  renders twice on the page, and duplicate SVG ids in one document are
 *  invalid — the second copy would silently reference the first's defs. */
function Wing({ mirror }: { mirror?: boolean }) {
  return (
    <g transform={mirror ? "translate(200,0) scale(-1,1)" : undefined}>
      {/* crest: an S off the stem, curling back on itself */}
      <path d="M100,80 C83,83 68,94 61,110 C55,124 59,137 71,139
               C80,140 86,134 86,126 C86,118 80,113 74,116 C69,118 68,123 71,126" />
      <path d="M100,92 C89,98 80,109 76,122" />
      {/* the scroll carrying the crest down into the wing — without it the
          two read as separate objects stacked, not as one ornament */}
      <path d="M92,128 C82,136 74,144 70,155" />

      {/* The wing: a full blade, and a second turned up over its shoulder.
          Two, not three — the blade already sweeps left and *down*, so every
          extra layer has to be rotated clear of it or the flourish closes
          into a knot. Positive rotation is the way up. */}
      <Leaf transform="translate(98,156)" />
      <Curl transform="translate(38,258)" />
      <Leaf transform="translate(94,144) rotate(40) scale(.62)" />
      <Curl transform="translate(94,144) rotate(40) scale(.62) translate(-60,102)" />
    </g>
  );
}

/** Finial, crest, wings, collar — the top of the pilaster. Flipped in CSS to
 *  make the foot, so the two ends are the same drawing. */
function Cap() {
  return (
    <svg className="mf-cap" viewBox="0 0 200 320" fill="none" aria-hidden>
      <g strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {/* finial */}
        <path d="M100,14 L100,26" />
        <path d="M100,26 C107,33 111,39 111,47 C111,56 107,63 100,70
                 C93,63 89,56 89,47 C89,39 93,33 100,26 Z" />
        <path d="M100,44 L100,52" />
        <path d="M100,70 L100,82" />

        <Wing />
        <Wing mirror />

        {/* the moulding the crest sits on; the wing stems emerge from
            behind it, which is how the join is made in the real thing */}
        <path d="M100,142 L106,150 L100,158 L94,150 Z" />
        <path d="M82,150 L92,150 M108,150 L118,150" />

        {/* collar: where the ornament becomes rod */}
        <path d="M83,282 L117,282" />
        <path d="M86,289 L114,289" />
        <path d="M90,297 L110,297" />
        <circle cx="100" cy="290" r="2.4" />
        {/* the rod, starting here and continuing into `.mf-rod` */}
        <path d="M96.5,297 L96.5,320 M103.5,297 L103.5,320" />
      </g>
    </svg>
  );
}

/** The waist: a lozenge with a palmette either side, riding the rod's middle. */
function Waist() {
  const half = (
    <>
      <Leaf transform="translate(92,58) rotate(-64) scale(.5)" />
      <Leaf transform="translate(92,62) rotate(-96) scale(.38)" />
      <Curl transform="translate(46,40) rotate(-64) scale(.5)" />
      <circle cx="36" cy="60" r="2.6" />
    </>
  );
  return (
    <svg className="mf-mid" viewBox="0 0 200 120" fill="none" aria-hidden>
      <g strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        <path d="M96.5,0 L96.5,42 M103.5,0 L103.5,42" />
        <path d="M96.5,78 L96.5,120 M103.5,78 L103.5,120" />
        <path d="M100,42 L109,60 L100,78 L91,60 Z" />
        {half}
        <g transform="translate(200,0) scale(-1,1)">{half}</g>
      </g>
    </svg>
  );
}

export default function MenuFlourish({ side }: { side: "left" | "right" }) {
  return (
    <div className={`menu-flourish mf-${side}`} aria-hidden>
      <Cap />
      <span className="mf-rod" />
      <Waist />
      <span className="mf-rod" />
      <div className="mf-foot"><Cap /></div>
    </div>
  );
}
