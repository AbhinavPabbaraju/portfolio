/** Small steaming-bowl mark in the menu header.
 *  Auto-ported from the legacy build; geometry preserved 1:1. */
export default function MenuBowlIcon() {
  return (
    <svg className="bowl" viewBox="0 0 46 40" aria-hidden="true">
                  <path className="steam s1" d="M16,14 C14,11 18,9 16,6 C15,4 17,3 16,1"/>
                  <path className="steam s2" d="M23,15 C21,12 25,10 23,7 C22,5 24,4 23,2"/>
                  <path className="steam s3" d="M30,14 C28,11 32,9 30,6 C29,4 31,3 30,1"/>
                  <path className="b-line" d="M5,21 L41,21 A18,15 0 0 1 30,37 L16,37 A18,15 0 0 1 5,21 Z"/>
                  <path className="b-line" d="M10,26 L36,26" opacity=".45"/>
                  <path className="b-line" d="M33,19 L44,8 M36,20 L46,10" opacity=".7"/>
                </svg>
  );
}
