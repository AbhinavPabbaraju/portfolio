/** Full-bleed night street: sky, skyline, sakura, houses, lamps, wires.
 *  Auto-ported from the legacy build; geometry preserved 1:1. */
export default function Backdrop() {
  return (
    <svg viewBox="0 0 1600 720" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="bskyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#08080e"/><stop offset=".72" stopColor="#0b1216"/>
                  <stop offset="1" stopColor="#0f1d28"/>
                </linearGradient>
                <filter id="bblur" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="9"/>
                </filter>
                {/* clouds want a far wider kernel than the lamp haloes do —
                    at stdDeviation 9 an overcast bank still shows its edge */}
                <filter id="bcloudB" x="-40%" y="-120%" width="180%" height="340%">
                  <feGaussianBlur stdDeviation="26"/>
                </filter>
                {/* Overcast, lit from beneath by the city rather than from
                    above by anything — so the underside is the warm edge and
                    the top stays cold. Inverting that is what makes painted
                    night clouds read as daytime clouds with the lights off. */}
                <linearGradient id="bcloudG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#385461" stopOpacity=".55"/>
                  <stop offset=".62" stopColor="#446474" stopOpacity=".75"/>
                  <stop offset="1" stopColor="#547286" stopOpacity=".9"/>
                </linearGradient>
                {/* Distance haze. The whole scene used to sit inside two
                    values — a #0c1215 skyline against a #0b1216 sky — so
                    nothing read as further away than anything else, and the
                    service drops appeared to end in open air because the
                    roofs they land on were invisible. Depth here is what
                    every other fix hangs off. */}
                <linearGradient id="bhaze" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1e313b" stopOpacity="0"/>
                  <stop offset=".55" stopColor="#203742" stopOpacity=".34"/>
                  <stop offset="1" stopColor="#27424e" stopOpacity=".52"/>
                </linearGradient>
                {/* City glow off the far side of the block — the light the
                    street borrows from a district it cannot see. Warm at the
                    horizon, deep slate above, so roofs silhouette against it. */}
                <radialGradient id="bglow" cx=".5" cy="1" r=".62">
                  <stop offset="0" stopColor="#415d71" stopOpacity=".3"/>
                  <stop offset=".42" stopColor="#2a424f" stopOpacity=".15"/>
                  <stop offset="1" stopColor="#0b1216" stopOpacity="0"/>
                </radialGradient>
                {/* Wet asphalt. Reflection is strongest just under the light
                    and fades with distance across the surface, which is what
                    stops a mirrored gradient reading as painted-on gloss. */}
                <linearGradient id="bwet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1d3039" stopOpacity=".9"/>
                  <stop offset=".35" stopColor="#142730" stopOpacity=".55"/>
                  <stop offset="1" stopColor="#0a1114" stopOpacity=".18"/>
                </linearGradient>
                {/* A lamp's throw on wet ground: narrow at the pole, spreading
                    and dimming down the surface toward the viewer. */}
                <linearGradient id="bthrow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f2a656" stopOpacity=".3"/>
                  <stop offset=".5" stopColor="#e08b3e" stopOpacity=".11"/>
                  <stop offset="1" stopColor="#e08b3e" stopOpacity="0"/>
                </linearGradient>
                {/* ground fog: no hard edge anywhere, or the band reads as a
                    shape sliding rather than as air moving */}
                <radialGradient id="bfogG" cx=".5" cy=".5" r=".5">
                  <stop offset="0" stopColor="#61879a" stopOpacity=".2"/>
                  <stop offset=".55" stopColor="#547b8e" stopOpacity=".1"/>
                  <stop offset="1" stopColor="#486d7e" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="bpool" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#33505e" stopOpacity=".55"/>
                  <stop offset="1" stopColor="#15262f" stopOpacity=".2"/>
                </linearGradient>
                {/* one blossom cluster, reused at many scales */}
                <g id="bpuff">
                  <circle r="13" fill="#4e3247"/>
                  <circle cx="-11" cy="4" r="9" fill="#5a3a52"/>
                  <circle cx="10" cy="3" r="9.5" fill="#5a3a52"/>
                  <circle cx="-4" cy="-8" r="8.5" fill="#6b4661"/>
                  <circle cx="6" cy="-9" r="7" fill="#7d4f6d"/>
                  <circle cx="-2" cy="-3" r="2.4" fill="#9a6a86"/>
                  <circle cx="7" cy="-14" r="1.8" fill="#a87792"/>
                </g>
                {/* a smaller one — cherry flowers come in clusters of 2–5, so the
                    canopy edge wants finer stipple than the big puff gives */}
                <g id="bpuffS">
                  <circle r="7" fill="#4e3247"/>
                  <circle cx="-6" cy="2" r="5" fill="#5a3a52"/>
                  <circle cx="5" cy="2" r="5.2" fill="#5a3a52"/>
                  <circle cx="-2" cy="-4" r="4.6" fill="#6b4661"/>
                  <circle cx="3" cy="-5" r="3.8" fill="#7d4f6d"/>
                  <circle cx="-1" cy="-1" r="1.4" fill="#9a6a86"/>
                </g>
              </defs>
    
              <rect width="1600" height="720" fill="url(#bskyG)"/>
    
              {/* crescent moon, mostly asleep */}
              <g opacity=".22">
                <circle cx="212" cy="96" r="22" fill="#d6e6ee"/>
                <circle cx="222" cy="90" r="21" fill="#091013"/>
              </g>
              <g fill="#cadfea" opacity=".4">
                <circle cx="120" cy="150" r="1"/><circle cx="330" cy="70" r="1.1"/><circle cx="1180" cy="46" r="1"/>
                <circle cx="1360" cy="120" r="1.2"/><circle cx="1540" cy="66" r=".9"/><circle cx="760" cy="40" r=".9"/>
              </g>
              {/* ── distant cloud banks ──
                  Three, at different heights and speeds. Kept under 0.1
                  opacity: at 2am a real overcast is barely a value shift,
                  and anything more competes with the shop for the eye. */}
              {/* The blur goes on the same element that moves. With it on a
                  parent and the transform on the children, the filter input
                  changes every frame and a 26px Gaussian gets recomputed
                  across the whole sky each time; this way each bank is
                  rasterised once and then translated on the compositor. */}
              <g>
                <g className="bcloud" filter="url(#bcloudB)" opacity=".26">
                  <ellipse cx="330" cy="118" rx="210" ry="26" fill="url(#bcloudG)"/>
                  <ellipse cx="470" cy="104" rx="140" ry="20" fill="url(#bcloudG)"/>
                  <ellipse cx="196" cy="128" rx="110" ry="17" fill="url(#bcloudG)"/>
                </g>
                <g className="bcloud c2" filter="url(#bcloudB)" opacity=".2">
                  <ellipse cx="1120" cy="76" rx="260" ry="24" fill="url(#bcloudG)"/>
                  <ellipse cx="1290" cy="90" rx="170" ry="18" fill="url(#bcloudG)"/>
                </g>
                <g className="bcloud c3" filter="url(#bcloudB)" opacity=".15">
                  <ellipse cx="760" cy="188" rx="330" ry="20" fill="url(#bcloudG)"/>
                  <ellipse cx="1480" cy="176" rx="200" ry="16" fill="url(#bcloudG)"/>
                </g>
              </g>

              {/* Overhead lines. Every span now either leaves the frame or dies on
                  the pole's crossarms, and every drop lands on a roof — the old
                  set had two wires plunging 200px into the pole from a flat
                  sweep, and three more (900,398 · 1140,406 · 1120,170) simply
                  stopping in open sky. */}
              <g fill="none" strokeLinecap="round">
                {/* pass-over traffic: high, edge to edge, never meets the pole */}
                <path d="M-10,72 C420,108 900,90 1610,118" stroke="#172126" strokeWidth="1.2"/>
                <path d="M-10,96 C380,134 880,116 1610,142" stroke="#182125" strokeWidth="1.1"/>
                {/* the long spans that land on the pole, sagging the whole way */}
                <path d="M-10,128 C360,178 820,252 1454,352" stroke="#1b2327" strokeWidth="1.4"/>
                {/* a splice mid-run: two spans meeting at an insulator, rather
                    than one wire ending at nothing */}
                <path d="M-10,178 C260,208 540,200 812,208" stroke="#161e22" strokeWidth="1.1"/>
                <path d="M812,208 C1010,222 1220,278 1458,372" stroke="#161e22" strokeWidth="1.1"/>
                {/* service drops, each one touching down on a roof */}
                <path d="M298,172 C302,236 306,296 308,350" stroke="#151d21" strokeWidth="1.1"/>
                <path d="M618,123 C634,188 650,250 662,310" stroke="#151d21" strokeWidth="1.1"/>
                {/* insulators sit on the joins, so the drops read as tapped off
                    the span above rather than sprouting from empty air */}
                <circle cx="812" cy="208" r="2" fill="#212d33" stroke="none"/>
                <circle cx="298" cy="172" r="2" fill="#212d33" stroke="none"/>
                <circle cx="618" cy="123" r="2.2" fill="#212d33" stroke="none"/>
              </g>
    
              {/* ── city glow ──
                  Sits under everything built, so every roofline from here
                  down is read as a silhouette against it rather than as a
                  shape floating in an unlit void. */}
              <rect x="-10" y="150" width="1620" height="470" fill="url(#bglow)"/>

              {/* ── far skyline: the district beyond the block ──
                  Lifted well clear of the sky value and hazed, because
                  distance is the only thing separating this band from the
                  one in front of it. Flat-topped boxes read as boxes, so the
                  roofline carries stair-stepped parapets, a water tank and a
                  mast — the profile of a Tokyo backstreet block seen over
                  the rooftops opposite. */}
              <g fill="#14132a">
                <rect x="-10" y="330" width="120" height="280"/>
                <rect x="210" y="290" width="90" height="320"/>
                <rect x="330" y="360" width="140" height="250"/>
                <rect x="620" y="310" width="110" height="300"/>
                <rect x="900" y="340" width="130" height="270"/>
                <rect x="1120" y="300" width="100" height="310"/>
                <rect x="1540" y="330" width="80" height="280"/>
                {/* parapets and set-backs — the step is what reads as a roof */}
                <rect x="210" y="278" width="52" height="14"/>
                <rect x="620" y="298" width="64" height="14"/>
                <rect x="1120" y="288" width="46" height="14"/>
                <rect x="900" y="330" width="74" height="12"/>
                <rect x="330" y="350" width="58" height="12"/>
                {/* rooftop water tank on its legs, the one silhouette that
                    says "this is a city" without any detail at all */}
                <rect x="944" y="300" width="42" height="26" rx="3"/>
                <rect x="950" y="326" width="5" height="16"/><rect x="975" y="326" width="5" height="16"/>
                {/* stair bulkheads */}
                <rect x="1176" y="286" width="26" height="18"/>
                <rect x="66" y="316" width="30" height="16"/>
              </g>
              {/* masts, with the pinpoint red aircraft lamp every tall thing
                  in a Japanese city carries */}
              <g stroke="#1f323b" strokeWidth="2">
                <line x1="255" y1="278" x2="255" y2="238"/><line x1="1170" y1="286" x2="1170" y2="248"/>
                <line x1="964" y1="300" x2="964" y2="276"/>
              </g>
              <g fill="#c7423f">
                <circle cx="255" cy="236" r="1.8" opacity=".75"/>
                <circle cx="1170" cy="246" r="1.8" opacity=".6"/>
              </g>
              {/* haze packed against the base of the far band, thickest at the
                  street where the air is deepest — this is what pushes the
                  block back rather than merely tinting it */}
              <rect x="-10" y="300" width="1620" height="310" fill="url(#bhaze)" opacity=".5"/>

              {/* ══ the street ══
                  Drawn here, before anything in the near ground, so every
                  tree, house and pole in front stands *on* it rather than
                  in front of it. The old surface was two faint ellipses on
                  bare backdrop, which is why nothing in the scene had a
                  base and the trees appeared to float.

                  Read from the horizon down: kerb, far lane in haze, wet
                  near lane, then the reflections. Wet asphalt is mostly a
                  value trick — the road is *darker* than dry road, and only
                  the parts under a light are bright. Lighting the whole
                  surface evenly is what makes CG streets look like plastic. */}
              <g>
                {/* the kerb: a hairline of caught light where wall meets road,
                    and the soft occlusion beneath it */}
                <rect x="-10" y="607" width="1620" height="2" fill="#344b57" opacity=".5"/>
                <rect x="-10" y="609" width="1620" height="9" fill="#070c0e" opacity=".55"/>

                {/* the surface itself */}
                <rect x="-10" y="609" width="1620" height="111" fill="url(#bwet)"/>

                {/* Lamp throw. Each is a wedge — narrow where it leaves the
                    pole, spreading toward the viewer — because a light on a
                    surface is a projection, not a circle.

                    Everything a bulb puts on the ground is drawn up here, in
                    the street, while the bulbs themselves are down in their
                    own flanks — so the heads guttered and their pools sat
                    perfectly steady, which is what gave the flicker away as
                    an effect on a lamp rather than a lamp going bad. The
                    wrappers fix that without moving a single coordinate or
                    changing paint order: `.lampFlick` drives the group, the
                    child keeps its own alpha, and group compositing
                    multiplies the two. Reusing the same two classes verbatim
                    is also what keeps pool and bulb in phase — identical
                    duration and delay on elements that mount together cannot
                    drift. `.lampFlick` is the left bulb at x298, `.l2` the
                    right one at x1518. */}
                <g className="lampGlow"><path d="M262,612 L332,612 L392,720 L202,720 Z" fill="url(#bthrow)"/></g>
                <g className="lampGlow l2"><path d="M1466,612 L1534,612 L1596,720 L1404,720 Z" fill="url(#bthrow)"/></g>

                {/* The vertical smear each lamp lays on wet ground, directly
                    beneath itself. This is the single strongest cue that a
                    surface is wet. */}
                <g className="lampGlow"><ellipse cx="297" cy="668" rx="15" ry="58" fill="#f2a656" opacity=".1"/></g>
                <g className="lampGlow l2"><ellipse cx="1500" cy="672" rx="17" ry="52" fill="#f2a656" opacity=".09"/></g>

                {/* painted centre line, foreshortened — the dashes lengthen
                    and thicken as they come toward the viewer, which is the
                    whole of the perspective cue at this distance */}
                <g fill="#697e88" opacity=".16">
                  <rect x="470" y="628" width="26" height="2"/>
                  <rect x="560" y="644" width="34" height="2.6"/>
                  <rect x="668" y="666" width="46" height="3.4"/>
                  <rect x="800" y="696" width="62" height="4.4"/>
                </g>

                {/* utility covers — a drain at the kerb and a manhole out in
                    the lane, both elliptical for the viewing angle */}
                <g>
                  <ellipse cx="1042" cy="652" rx="30" ry="8" fill="#0c1316" opacity=".8"/>
                  <ellipse cx="1042" cy="651" rx="30" ry="8" fill="none" stroke="#2f424c" strokeWidth=".8" opacity=".6"/>
                  <ellipse cx="1042" cy="651" rx="19" ry="5" fill="none" stroke="#283941" strokeWidth=".7" opacity=".5"/>
                  <rect x="392" y="620" width="52" height="7" rx="1.5" fill="#0b1114" opacity=".75"/>
                  <g stroke="#354b56" strokeWidth=".7" opacity=".4">
                    <line x1="398" y1="621" x2="398" y2="626"/><line x1="408" y1="621" x2="408" y2="626"/>
                    <line x1="418" y1="621" x2="418" y2="626"/><line x1="428" y1="621" x2="428" y2="626"/>
                    <line x1="438" y1="621" x2="438" y2="626"/>
                  </g>
                </g>

                {/* Puddles. Each one is a hole in the road showing the sky,
                    so it takes the slate of the air above it and a warm rim
                    only where a lamp can actually reach it. Shapes are
                    irregular on purpose — an even ellipse reads as a stain. */}
                <g>
                  <path d="M196,676 C238,664 306,666 344,678 C368,686 340,700 286,701 C226,702 176,690 196,676 Z"
                        fill="url(#bpool)"/>
                  {/* The warm rim and the reflection are the lamp; the pool
                      itself is a hole showing the sky, so it stays put. */}
                  <g className="lampGlow">
                    <path d="M206,678 C246,668 300,670 332,679" fill="none" stroke="#f2a656" strokeWidth="1.6" opacity=".22"/>
                    <ellipse cx="297" cy="686" rx="9" ry="15" fill="#f2a656" opacity=".16"/>
                  </g>

                  <path d="M1408,690 C1452,676 1530,678 1572,692 C1600,702 1560,716 1500,717 C1436,718 1384,702 1408,690 Z"
                        fill="url(#bpool)"/>
                  <g className="lampGlow l2"><ellipse cx="1500" cy="700" rx="10" ry="17" fill="#f2a656" opacity=".15"/></g>

                  {/* a small one further out, catching only the sky */}
                  <path d="M690,632 C716,627 754,628 772,634 C784,638 762,644 730,645 C700,645 678,637 690,632 Z"
                        fill="url(#bpool)" opacity=".7"/>
                </g>

                {/* cracks and grit — the road is old */}
                <g stroke="#070d10" strokeWidth="1" opacity=".5" fill="none">
                  <path d="M520,690 L556,672 L584,678 L612,662"/>
                  <path d="M556,672 L548,656"/>
                  <path d="M1180,646 L1216,636 L1244,641"/>
                </g>
                <g fill="#455c67" opacity=".2">
                  <circle cx="640" cy="700" r="1.6"/><circle cx="672" cy="688" r="1.2"/>
                  <circle cx="900" cy="712" r="1.8"/><circle cx="1130" cy="672" r="1.3"/>
                  <circle cx="380" cy="694" r="1.4"/><circle cx="1290" cy="700" r="1.5"/>
                </g>

                {/* weeds at the kerb, where nobody sweeps */}
                <g stroke="#2c3a2e" strokeWidth="1.2" fill="none" opacity=".55" strokeLinecap="round">
                  <path d="M126,618 C124,610 120,606 116,602"/><path d="M128,618 C129,610 132,606 136,603"/>
                  <path d="M131,618 C132,611 135,608 139,606"/>
                  <path d="M1236,618 C1234,611 1231,607 1227,604"/><path d="M1239,618 C1240,611 1243,608 1247,605"/>
                </g>
              </g>
              <g opacity=".8">
                <rect x="20" y="366" width="10" height="13" fill="#213037"/>
                <rect x="48" y="410" width="10" height="13" fill="#182227"/>
                <rect x="238" y="330" width="9" height="12" fill="#443122"/>
                <rect x="262" y="380" width="9" height="12" fill="#1e2b32"/>
                <rect x="652" y="352" width="9" height="12" fill="#213037"/>
                <rect x="938" y="382" width="9" height="12" fill="#3c2c20"/>
                <rect x="1146" y="338" width="9" height="12" fill="#1e2b32"/>
                <rect x="1566" y="372" width="9" height="12" fill="#213037"/>
              </g>
    
              {/* distant houses asleep behind the sakura */}
              <g>
                <polygon points="14,506 58,472 102,506" fill="#131b1f"/>
                <rect x="22" y="505" width="72" height="102" fill="#0e1518" stroke="#1c252a" strokeWidth="1"/>
                <rect x="34" y="524" width="14" height="17" fill="#4a3624"/>
                <rect x="31" y="521" width="20" height="23" fill="none" stroke="#0a1013" strokeWidth="2"/>
                <polygon points="128,528 164,500 200,528" fill="#111b1f"/>
                <rect x="136" y="527" width="58" height="80" fill="#0c1316" stroke="#1a2328" strokeWidth="1"/>
                <rect x="150" y="544" width="12" height="14" fill="#2b3b43"/>
                <rect x="176" y="500" width="5" height="18" fill="#0e1518"/>
              </g>
    
              {/* ===== left flank: old sakura + alley ===== */}
              <g>
                {/* soft canopy haze behind the clusters — broad and flattened,
                    following the vase-shaped spreading crown of an old cherry */}
                <ellipse cx="128" cy="330" rx="122" ry="70" fill="#55374d" opacity=".18" filter="url(#bblur)"/>

                {/* Trunk as a filled taper, not a constant-width stroke: ~52 units
                    across at the root flare down to 18 where the limbs leave. */}
                <path d="M96,618 C106,604 110,588 108,564 C106,532 110,514 112,486
                         C114,462 117,452 119,438 L137,438 C136,458 133,464 132,488
                         C130,516 134,536 136,564 C138,590 142,604 148,618 Z"
                      fill="#101519"/>
                <path d="M132,600 C130,566 134,540 131,506 C129,478 133,462 134,442"
                      fill="none" stroke="#191f25" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
                {/* horizontal lenticels — the one bark marking that reads as
                    cherry and nothing else */}
                <g stroke="#1e262d" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="105" y1="600" x2="125" y2="599" opacity=".5"/>
                  <line x1="131" y1="588" x2="144" y2="587" opacity=".38"/>
                  <line x1="107" y1="572" x2="131" y2="571" opacity=".52"/>
                  <line x1="120" y1="562" x2="134" y2="561" opacity=".34"/>
                  <line x1="108" y1="544" x2="121" y2="543" opacity=".46"/>
                  <line x1="125" y1="532" x2="135" y2="531" opacity=".36"/>
                  <line x1="110" y1="518" x2="130" y2="517" opacity=".5"/>
                  <line x1="116" y1="506" x2="126" y2="505" opacity=".32"/>
                  <line x1="112" y1="490" x2="129" y2="489" opacity=".48"/>
                  <line x1="121" y1="476" x2="132" y2="475" opacity=".34"/>
                  <line x1="115" y1="458" x2="128" y2="457" opacity=".44"/>
                  <line x1="122" y1="448" x2="133" y2="447" opacity=".3"/>
                </g>

                {/* main limbs — they leave the trunk low and fan outward before
                    turning up, which is what gives the vase its shoulders */}
                <g fill="none" stroke="#101519" strokeWidth="7" strokeLinecap="round">
                  <path d="M124,446 C104,436 82,432 58,428 C46,426 38,420 32,410"/>
                  <path d="M126,440 C112,414 100,392 84,372"/>
                  <path d="M129,436 C132,406 134,380 138,352"/>
                  <path d="M130,442 C152,424 174,410 198,400"/>
                  <path d="M129,438 C146,412 164,394 186,376"/>
                </g>
                {/* second order */}
                <g fill="none" stroke="#101519" strokeWidth="4" strokeLinecap="round">
                  <path d="M58,428 C50,414 44,404 38,392"/>
                  <path d="M82,432 C76,416 70,406 62,394"/>
                  <path d="M84,372 C76,358 70,350 62,338"/>
                  <path d="M100,392 C94,376 90,366 84,354"/>
                  <path d="M138,352 C136,332 138,318 142,302"/>
                  <path d="M134,380 C128,362 124,350 118,336"/>
                  <path d="M198,400 C206,386 212,376 220,364"/>
                  <path d="M174,410 C180,394 184,384 190,372"/>
                  <path d="M186,376 C194,360 200,350 208,338"/>
                  <path d="M164,394 C170,378 174,368 180,356"/>
                </g>
                {/* twigs reaching into the clusters */}
                <g fill="none" stroke="#141a20" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M38,392 C34,384 32,378 28,372"/>
                  <path d="M62,338 C58,330 56,324 52,316"/>
                  <path d="M142,302 C144,290 146,284 150,276"/>
                  <path d="M220,364 C226,354 230,348 236,340"/>
                  <path d="M208,338 C214,328 218,322 224,314"/>
                  <path d="M118,336 C114,326 112,318 108,308"/>
                  <path d="M84,354 C80,344 78,338 74,330"/>
                  <path d="M190,372 C194,362 197,356 201,348"/>
                  <path d="M32,410 C26,404 22,400 16,396"/>
                </g>

                {/* Blossom clusters ride the branch ends and crowd the rim, with
                    the interior left thinner so the limbs read through the bloom. */}
                <use href="#bpuff" transform="translate(150,276) scale(1.2)" opacity=".72"/>
                <use href="#bpuff" transform="translate(126,288) scale(1.15) rotate(-6)" opacity=".7"/>
                <use href="#bpuff" transform="translate(166,286) scale(1.1) rotate(9)" opacity=".68"/>
                <use href="#bpuff" transform="translate(98,302) scale(1.05) rotate(14)" opacity=".66"/>
                <use href="#bpuff" transform="translate(190,306) rotate(-11)" opacity=".64"/>
                <use href="#bpuff" transform="translate(138,326) scale(1.3)" opacity=".6"/>
                <use href="#bpuff" transform="translate(110,320) scale(1.2)" opacity=".62"/>
                <use href="#bpuff" transform="translate(172,322) scale(1.25)" opacity=".58"/>
                <use href="#bpuff" transform="translate(74,330) rotate(6)" opacity=".6"/>
                <use href="#bpuff" transform="translate(212,332) scale(1.05)" opacity=".56"/>
                <use href="#bpuff" transform="translate(56,344) scale(.95)" opacity=".56"/>
                <use href="#bpuff" transform="translate(88,358) scale(.9)" opacity=".54"/>
                <use href="#bpuff" transform="translate(196,352) scale(1)" opacity=".54"/>
                <use href="#bpuff" transform="translate(40,382) scale(.9) rotate(-8)" opacity=".5"/>
                <use href="#bpuff" transform="translate(228,354) scale(.85)" opacity=".5"/>
                <use href="#bpuff" transform="translate(30,406) scale(.8)" opacity=".46"/>
                {/* fringe stipple, softening the silhouette edge */}
                <use href="#bpuffS" transform="translate(150,262)" opacity=".6"/>
                <use href="#bpuffS" transform="translate(108,296)" opacity=".56"/>
                <use href="#bpuffS" transform="translate(184,290)" opacity=".56"/>
                <use href="#bpuffS" transform="translate(52,316)" opacity=".52"/>
                <use href="#bpuffS" transform="translate(224,314)" opacity=".52"/>
                <use href="#bpuffS" transform="translate(236,340)" opacity=".46"/>
                <use href="#bpuffS" transform="translate(16,396)" opacity=".42"/>
                <use href="#bpuffS" transform="translate(28,372)" opacity=".46"/>
                <use href="#bpuffS" transform="translate(206,372)" opacity=".48"/>
                <use href="#bpuffS" transform="translate(66,368)" opacity=".48"/>
                {/* weight back into the lower-right quadrant, which read thin
                    against the heavy sweep of the low left limb */}
                <use href="#bpuff" transform="translate(202,368) scale(.95)" opacity=".52"/>
                <use href="#bpuffS" transform="translate(224,382)" opacity=".44"/>
                <use href="#bpuffS" transform="translate(178,272)" opacity=".54"/>
                {/* a bare limb breaking back out through the bloom */}
                <path d="M150,276 C162,268 174,266 188,268" fill="none" stroke="#141a20" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
                {/* petals drifting down */}
                <circle className="petal"    cx="150" cy="360" r="2.6"/>
                <circle className="petal p2" cx="96"  cy="342" r="2.2"/>
                <circle className="petal p3" cx="196" cy="378" r="2.4"/>
                <circle className="petal p6" cx="126" cy="326" r="2"/>
                {/* fallen petals pooled at the roots */}
                <g fill="#8a5a74" opacity=".24">
                  <ellipse cx="98" cy="618" rx="4" ry="1.6"/><ellipse cx="146" cy="624" rx="3.4" ry="1.4"/>
                  <ellipse cx="176" cy="612" rx="3" ry="1.3"/><ellipse cx="66" cy="612" rx="3.2" ry="1.3"/>
                  <ellipse cx="126" cy="620" rx="2.6" ry="1.1"/>
                </g>
              </g>
              {/* left alley between buildings */}
              <g>
                <rect x="238" y="322" width="10" height="288" fill="#050508"/>
                <rect x="248" y="348" width="70" height="262" fill="#090e10"/>
                <line x1="283" y1="610" x2="283" y2="472" stroke="#222a2e" strokeWidth="5"/>
                <path d="M283,472 q0,-12 12,-12" fill="none" stroke="#222a2e" strokeWidth="4"/>
                <g className="lampFlick">
                  <circle cx="298" cy="460" r="4.5" fill="#ffd9a0"/>
                  <circle cx="298" cy="462" r="22" fill="#f2a656" opacity=".3" filter="url(#bblur)"/>
                  <polygon points="286,468 310,468 330,610 268,610" fill="#f2a656" opacity=".05"/>
                </g>
                {/* the patch on the pavement at its foot — ground, not bulb,
                    so it takes the deeper `lampg` swing on the same beat */}
                <g className="lampGlow"><rect x="276" y="616" width="46" height="20" fill="#f2a656" opacity=".08" filter="url(#bblur)"/></g>
              </g>
    
              {/* ===== right flank: a residential alley — houses, pole, one lamp ===== */}
              {/* sakura leaning over the rooflines */}
              <g>
                <ellipse cx="1330" cy="386" rx="80" ry="44" fill="#55374d" opacity=".16" filter="url(#bblur)"/>
                {/* same species, read at distance: tapered trunk, lenticels, two
                    orders of branch instead of one */}
                <path d="M1303,614 C1310,572 1304,542 1312,504 C1318,476 1314,452 1321,424
                         L1337,426 C1332,452 1332,478 1329,506 C1326,542 1330,572 1325,614 Z"
                      fill="#101519"/>
                <g stroke="#1e262d" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="1307" y1="596" x2="1321" y2="595" opacity=".44"/>
                  <line x1="1315" y1="578" x2="1326" y2="577" opacity=".3"/>
                  <line x1="1309" y1="558" x2="1324" y2="557" opacity=".42"/>
                  <line x1="1317" y1="540" x2="1328" y2="539" opacity=".28"/>
                  <line x1="1312" y1="522" x2="1327" y2="521" opacity=".4"/>
                  <line x1="1318" y1="500" x2="1330" y2="499" opacity=".3"/>
                  <line x1="1315" y1="478" x2="1330" y2="477" opacity=".38"/>
                  <line x1="1321" y1="462" x2="1332" y2="461" opacity=".26"/>
                </g>
                <g fill="none" stroke="#101519" strokeWidth="5.5" strokeLinecap="round">
                  <path d="M1324,436 C1306,428 1292,422 1274,414"/>
                  <path d="M1328,430 C1348,414 1362,406 1382,398"/>
                  <path d="M1327,428 C1328,410 1330,398 1332,384"/>
                </g>
                <g fill="none" stroke="#141a20" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M1274,414 C1268,406 1264,402 1258,396"/>
                  <path d="M1382,398 C1388,390 1392,386 1398,380"/>
                  <path d="M1332,384 C1332,376 1333,371 1334,364"/>
                  <path d="M1300,424 C1296,414 1294,408 1290,400"/>
                  <path d="M1356,410 C1360,400 1362,394 1366,386"/>
                </g>
                <use href="#bpuff" transform="translate(1332,364) scale(1.15)" opacity=".62"/>
                <use href="#bpuff" transform="translate(1300,382) rotate(-8)" opacity=".58"/>
                <use href="#bpuff" transform="translate(1364,382) rotate(12)" opacity=".58"/>
                <use href="#bpuff" transform="translate(1272,408) scale(.9) rotate(-10)" opacity=".5"/>
                <use href="#bpuff" transform="translate(1392,392) scale(.9)" opacity=".5"/>
                <use href="#bpuff" transform="translate(1332,398) scale(1.05)" opacity=".54"/>
                <use href="#bpuffS" transform="translate(1334,352)" opacity=".5"/>
                <use href="#bpuffS" transform="translate(1258,396)" opacity=".44"/>
                <use href="#bpuffS" transform="translate(1398,378)" opacity=".44"/>
                <use href="#bpuffS" transform="translate(1290,400)" opacity=".48"/>
                <use href="#bpuffS" transform="translate(1366,404)" opacity=".48"/>
                <circle className="petal p4" cx="1336" cy="396" r="2.4"/>
                <circle className="petal p5" cx="1302" cy="378" r="2"/>
                <g fill="#8a5a74" opacity=".22">
                  <ellipse cx="1316" cy="618" rx="3.6" ry="1.5"/><ellipse cx="1354" cy="610" rx="3" ry="1.3"/>
                </g>
              </g>
    
              {/* house A — closest, gabled, one window still awake */}
              <g>
                <polygon points="1338,458 1404,404 1470,458" fill="#1a2327"/>
                <path d="M1338,458 L1404,404 L1470,458" fill="none" stroke="#2b383f" strokeWidth="2"/>
                <path d="M1352,447 L1404,414 L1456,447" fill="none" stroke="#0d1418" strokeWidth="2" opacity=".8"/>
                <rect x="1332" y="456" width="144" height="7" rx="2" fill="#121b1f"/>
                <rect x="1346" y="463" width="116" height="148" fill="#12191d" stroke="#232b2f" strokeWidth="1.4"/>
                {/* warm window, muntined */}
                <rect x="1358" y="482" width="26" height="30" fill="#d98a3f" opacity=".85"/>
                <line x1="1371" y1="482" x2="1371" y2="512" stroke="#12191d" strokeWidth="2.5"/>
                <line x1="1358" y1="497" x2="1384" y2="497" stroke="#12191d" strokeWidth="2.5"/>
                <rect x="1354" y="478" width="34" height="38" fill="none" stroke="#0d1316" strokeWidth="3"/>
                <circle cx="1371" cy="497" r="17" fill="#f2a656" opacity=".14" filter="url(#bblur)"/>
                {/* sliding entry */}
                <rect x="1414" y="540" width="38" height="71" fill="#18282f"/>
                <g stroke="#0d1418" strokeWidth="2"><line x1="1427" y1="540" x2="1427" y2="611"/><line x1="1440" y1="540" x2="1440" y2="611"/></g>
                {/* low fence */}
                <g stroke="#1c252a" strokeWidth="3">
                  <line x1="1332" y1="592" x2="1348" y2="592"/><line x1="1332" y1="602" x2="1348" y2="602"/>
                  <line x1="1337" y1="586" x2="1337" y2="610"/>
                </g>
                {/* the 記 sign hangs off the eave, pointing down the gap */}
                <line x1="1466" y1="463" x2="1466" y2="476" stroke="#1b262d" strokeWidth="2.5"/>
                <rect x="1452" y="476" width="28" height="38" rx="4" fill="#141c20" stroke="#344751" strokeWidth="1.4"/>
                <text x="1466" y="502" textAnchor="middle" fill="#8fbcd4" opacity=".85"
                      style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'18px'}}>記</text>
              </g>
    
              {/* the gap itself: lamp, footpath, dark */}
              <g>
                <rect x="1476" y="430" width="54" height="181" fill="#070b0d"/>
                <line x1="1502" y1="610" x2="1502" y2="460" stroke="#222a2e" strokeWidth="5"/>
                <path d="M1502,460 q0,-13 13,-13" fill="none" stroke="#222a2e" strokeWidth="4"/>
                <g className="lampFlick l2">
                  <circle cx="1518" cy="447" r="5" fill="#ffd9a0"/>
                  <circle className="alGlow" cx="1518" cy="450" r="28" fill="#f2a656" filter="url(#bblur)"/>
                  <polygon points="1504,456 1532,456 1554,610 1482,610" fill="#f2a656" opacity=".06"/>
                </g>
                {/* same as its opposite number on the left flank */}
                <g className="lampGlow l2"><rect x="1490" y="616" width="60" height="22" fill="#f2a656" opacity=".09" filter="url(#bblur)"/></g>
                <path d="M1494,610 C1500,646 1512,672 1528,700" fill="none" stroke="#171e22" strokeWidth="10" opacity=".8" strokeLinecap="round"/>
              </g>
    
              {/* house B — set back, smaller, mostly asleep */}
              <g>
                <polygon points="1524,478 1574,438 1624,478" fill="#151d21"/>
                <path d="M1524,478 L1574,438 L1624,478" fill="none" stroke="#233037" strokeWidth="1.8"/>
                <rect x="1519" y="476" width="110" height="6" rx="2" fill="#0e161a"/>
                <rect x="1532" y="482" width="86" height="129" fill="#0e1518" stroke="#1e272b" strokeWidth="1.2"/>
                <rect x="1544" y="502" width="18" height="22" fill="#32444e"/>
                <rect x="1540" y="498" width="26" height="30" fill="none" stroke="#0a1013" strokeWidth="2.5"/>
                <rect x="1584" y="548" width="24" height="63" fill="#132127"/>
                <rect x="1596" y="500" width="16" height="10" rx="2" fill="#1a2125" stroke="#273237" strokeWidth="1"/>
              </g>
    
              {/* power pole stitching the alley to the grid.
                  Spans leave to the right for the next pole off frame; the two
                  that used to head back left died in mid-air at 900,398 and
                  1140,406 while duplicating the runs already arriving from that
                  side — that was the "splitting for no reason". In their place,
                  service drops to the two houses, which is what a pole is for. */}
              <g>
                <line x1="1476" y1="612" x2="1476" y2="332" stroke="#1a2125" strokeWidth="6"/>
                <line x1="1454" y1="352" x2="1498" y2="352" stroke="#1a2125" strokeWidth="4"/>
                <line x1="1458" y1="372" x2="1494" y2="372" stroke="#1a2125" strokeWidth="3.5"/>
                <circle cx="1460" cy="350" r="2" fill="#273237"/><circle cx="1492" cy="350" r="2" fill="#273237"/>
                <circle cx="1462" cy="370" r="1.8" fill="#273237"/><circle cx="1490" cy="370" r="1.8" fill="#273237"/>
                {/* onward to the next pole, off frame */}
                <path d="M1492,352 C1530,360 1570,362 1610,368" fill="none" stroke="#172126" strokeWidth="1.3"/>
                <path d="M1494,372 C1532,382 1572,386 1610,394" fill="none" stroke="#151e22" strokeWidth="1.1"/>
                {/* drops down to house A's eave and across the gap to house B */}
                <path d="M1476,422 C1473,438 1469,452 1462,466" fill="none" stroke="#151d21" strokeWidth="1.1"/>
                {/* swung right of the lamp — the earlier line cut straight
                    through the bulb */}
                <path d="M1494,372 C1516,392 1534,432 1542,484" fill="none" stroke="#151d21" strokeWidth="1"/>
                <rect x="1470" y="404" width="12" height="18" rx="2" fill="#12191d" stroke="#212d33" strokeWidth="1"/>
              </g>
    
              {/* ══ ambient ══
                  Drifting ground fog, low and slow. Two bands crossing in
                  opposite directions at different speeds so the movement
                  never resolves into a single sliding sheet — that is the
                  tell that gives away one animated layer pretending to be
                  air. Both are transform-only, so this costs the compositor
                  and nothing else. */}
              <g className="bfog" opacity=".5">
                <ellipse cx="420" cy="640" rx="440" ry="34" fill="url(#bfogG)"/>
                <ellipse cx="1180" cy="662" rx="380" ry="28" fill="url(#bfogG)"/>
              </g>
              <g className="bfog f2" opacity=".38">
                <ellipse cx="860" cy="676" rx="520" ry="30" fill="url(#bfogG)"/>
                <ellipse cx="180" cy="694" rx="300" ry="24" fill="url(#bfogG)"/>
              </g>

              {/* ══ foreground ══
                  The layer the scene never had. Everything above stands at
                  or beyond the shop's own depth, so the eye had nothing near
                  to measure the rest against — which is most of why the
                  street read flat however much haze went behind it.

                  These sit at the outer edges on purpose. The facade covers
                  the middle of this viewBox at every viewport, and at 1200px
                  it covers x 147–1453, so the margins are the only part
                  reliably on screen. Values are the darkest in the scene and
                  the rim light falls on the side facing the nearest lamp —
                  x 298 on the left, x 1518 on the right. */}

              {/* left kerb: the overflow of a shop that shut hours ago */}
              <g>
                {/* stacked crates, the milk-crate kind every backstreet has */}
                <g fill="#090f12" stroke="#1e2b32" strokeWidth="1.1">
                  <rect x="18" y="578" width="42" height="16" rx="1.5"/>
                  <rect x="20" y="594" width="42" height="16" rx="1.5"/>
                  <rect x="64" y="590" width="38" height="20" rx="1.5"/>
                </g>
                {/* lattice, just enough to read as crate rather than box */}
                <g stroke="#263841" strokeWidth=".7" opacity=".55">
                  <line x1="32" y1="578" x2="32" y2="594"/><line x1="46" y1="578" x2="46" y2="594"/>
                  <line x1="34" y1="594" x2="34" y2="610"/><line x1="48" y1="594" x2="48" y2="610"/>
                  <line x1="77" y1="590" x2="77" y2="610"/><line x1="89" y1="590" x2="89" y2="610"/>
                </g>
                {/* rim off the lamp, catching only the right edges */}
                <g fill="#f2a656" opacity=".16">
                  <rect x="58" y="578" width="1.6" height="16"/>
                  <rect x="60" y="594" width="1.6" height="16"/>
                  <rect x="100" y="590" width="1.6" height="20"/>
                </g>

                {/* a bicycle against the wall — the single most common object
                    on a Japanese side street, and a silhouette that reads at
                    any size */}
                <g stroke="#162126" strokeWidth="2.4" fill="none" strokeLinecap="round">
                  <circle cx="118" cy="592" r="17"/>
                  <circle cx="170" cy="592" r="17"/>
                  <path d="M118,592 L140,566 L170,592"/>
                  <path d="M140,566 L128,592"/>
                  <path d="M140,566 L152,562"/>
                  <path d="M170,592 L166,562 L156,558"/>
                </g>
                {/* basket and saddle */}
                <path d="M160,556 L178,556 L175,568 L163,568 Z" fill="#10181c" stroke="#1e2b32" strokeWidth="1.2"/>
                <path d="M134,562 L146,562 L143,566 L137,566 Z" fill="#162126"/>
                {/* the lamp catches the rims and the near side of the frame */}
                <g stroke="#f2a656" opacity=".2" strokeWidth="1.2" fill="none">
                  <path d="M131,580 A17,17 0 0 1 133,603"/>
                  <path d="M183,580 A17,17 0 0 1 185,603"/>
                </g>

                {/* planter by the door, half dead */}
                <path d="M186,596 L212,596 L209,610 L189,610 Z" fill="#0b1216" stroke="#202e35" strokeWidth="1.1"/>
                <g stroke="#2f3f31" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".8">
                  <path d="M194,596 C191,584 189,578 192,570"/>
                  <path d="M199,596 C200,582 203,576 208,570"/>
                  <path d="M203,596 C204,588 207,584 211,581"/>
                </g>

                {/* convex traffic mirror — every blind corner in Japan has
                    one, and it gives the flank a vertical it badly needed */}
                <line x1="238" y1="610" x2="238" y2="512" stroke="#32454e" strokeWidth="4"/>
                {/* the lamp is to the right, so the post keeps a rim on that side */}
                <line x1="240" y1="606" x2="240" y2="516" stroke="#f2a656" strokeWidth="1" opacity=".22"/>
                {/* bracket: the mirror is bolted to the post, not balanced on it */}
                <path d="M238,516 L230,510" stroke="#32454e" strokeWidth="3" fill="none"/>
                <ellipse cx="230" cy="504" rx="19" ry="17" fill="#1e2c32" stroke="#34454e" strokeWidth="2"/>
                {/* what it reflects: the lamp, smeared across the curve */}
                <ellipse cx="235" cy="500" rx="7" ry="6" fill="#f2a656" opacity=".18"/>
                <path d="M226,494 A15,13 0 0 1 241,500" fill="none" stroke="#66818e" strokeWidth="1.4" opacity=".4"/>
                {/* the backing plate's shadowed underside */}
                <path d="M213,510 A19,17 0 0 0 247,510" fill="none" stroke="#0a1114" strokeWidth="2.4"/>

                {/* contact shadows — the fix for everything appearing to hover */}
                <g fill="#040709" opacity=".55">
                  <ellipse cx="42" cy="611" rx="30" ry="3.4"/>
                  <ellipse cx="86" cy="611" rx="24" ry="3"/>
                  <ellipse cx="144" cy="611" rx="62" ry="4"/>
                  <ellipse cx="199" cy="611" rx="16" ry="2.6"/>
                  <ellipse cx="238" cy="611" rx="10" ry="2.4"/>
                </g>
              </g>

              {/* right kerb: the pole's hardware, and the house's doorstep */}
              <g>
                {/* Transformer and junction box. A pole carrying service drops
                    to two houses needs somewhere to step the voltage down —
                    without it the crossarms were carrying wire to nothing. */}
                <ellipse cx="1456" cy="392" rx="13" ry="19" fill="#131a1e" stroke="#28383f" strokeWidth="1.4"/>
                <rect x="1449" y="374" width="14" height="5" rx="1.5" fill="#1e292f"/>
                <line x1="1462" y1="384" x2="1474" y2="384" stroke="#202d33" strokeWidth="1.6"/>
                <line x1="1462" y1="400" x2="1474" y2="400" stroke="#202d33" strokeWidth="1.6"/>
                {/* conduit dropping from the box already on the pole at y404
                    — a second box here collided with the 記 sign hanging off
                    house A's eave, and the pole only needs the one */}
                <line x1="1483" y1="422" x2="1483" y2="470" stroke="#1f2b31" strokeWidth="2.6"/>
                <line x1="1483" y1="470" x2="1483" y2="596" stroke="#1b262b" strokeWidth="2.2"/>
                {/* step bolts */}
                <g stroke="#233037" strokeWidth="2" strokeLinecap="round">
                  <line x1="1470" y1="520" x2="1482" y2="520"/><line x1="1470" y1="546" x2="1482" y2="546"/>
                  <line x1="1470" y1="572" x2="1482" y2="572"/>
                </g>
                {/* base collar and its shadow */}
                <rect x="1468" y="600" width="17" height="11" rx="2" fill="#0b1215"/>

                {/* potted plants at house B's step — the one warm domestic
                    note on this side */}
                <path d="M1556,594 L1578,594 L1575,611 L1559,611 Z" fill="#0c1418" stroke="#212e35" strokeWidth="1.1"/>
                <g stroke="#33452f" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity=".8">
                  <path d="M1563,594 C1560,582 1559,574 1563,566"/>
                  <path d="M1568,594 C1569,580 1572,573 1578,568"/>
                  <path d="M1572,594 C1573,586 1576,581 1581,578"/>
                </g>
                <path d="M1584,600 L1600,600 L1598,611 L1586,611 Z" fill="#0c1418" stroke="#212e35" strokeWidth="1.1"/>
                <g stroke="#33452f" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".7">
                  <path d="M1590,600 C1588,591 1588,586 1591,581"/>
                  <path d="M1594,600 C1595,591 1597,587 1601,584"/>
                </g>
                {/* gas meter, boxed and bracketed to the wall */}
                <rect x="1528" y="556" width="18" height="22" rx="2" fill="#10181c" stroke="#27373f" strokeWidth="1.1"/>
                <circle cx="1537" cy="564" r="4" fill="none" stroke="#364953" strokeWidth="1"/>
                <line x1="1537" y1="578" x2="1537" y2="592" stroke="#1f2a2f" strokeWidth="2.2"/>

                <g fill="#040709" opacity=".55">
                  <ellipse cx="1476" cy="611" rx="16" ry="3"/>
                  <ellipse cx="1567" cy="611" rx="16" ry="2.8"/>
                  <ellipse cx="1592" cy="611" rx="12" ry="2.4"/>
                </g>
              </g>

              {/* Fireflies. Six, not sixty — at this scale a swarm reads as
                  noise on the screen rather than as life in the scene. Each
                  drifts on its own duration so they never pulse in unison. */}
              <g fill="#e0c887">
                <circle className="bfly" cx="168" cy="552" r="1.8"/>
                <circle className="bfly b2" cx="214" cy="516" r="1.5"/>
                <circle className="bfly b3" cx="106" cy="580" r="1.6"/>
                <circle className="bfly b4" cx="1352" cy="546" r="1.6"/>
                <circle className="bfly b5" cx="1290" cy="572" r="1.4"/>
                <circle className="bfly b6" cx="1418" cy="596" r="1.7"/>
              </g>

              {/* street surface provided by the shared plane behind this svg */}
              <ellipse cx="180" cy="668" rx="70" ry="8" fill="#5b93b3" opacity=".035"/>
              <ellipse cx="1400" cy="682" rx="84" ry="9" fill="#f2a656" opacity=".04"/>
            </svg>
  );
}
