/** The ramen bowl that slides across the counter.
 *  Auto-ported from the legacy build; geometry preserved 1:1. */
export default function ServeBowl() {
  return (
    <svg className="s-bowl" id="serveBowl" viewBox="0 0 120 96" aria-hidden="true">
                  <path className="stm" style={{strokeWidth:'2'}} d="M44,34 C41,27 48,23 44,15 C42,10 46,7 44,1"/>
                  <path className="stm b" style={{strokeWidth:'2'}} d="M60,36 C57,29 64,25 60,17 C58,12 62,9 60,3"/>
                  <path className="stm c" style={{strokeWidth:'2'}} d="M76,34 C73,27 80,23 76,15 C74,10 78,7 76,1"/>
                  <path className="b-line" d="M78,42 L112,10 M84,44 L118,14" opacity=".75"/>
                  <path className="b-fill" d="M14,48 L106,48 A46,40 0 0 1 78,90 L42,90 A46,40 0 0 1 14,48 Z"/>
                  <path className="b-band" d="M22,62 C40,68 80,68 98,62 L94,72 C74,77 46,77 26,72 Z"/>
                  <ellipse cx="60" cy="48" rx="46" ry="7" fill="#e8b04c" stroke="#2b2318" strokeWidth="2.4"/>
                  <path d="M30,47 C42,44 78,44 90,47" fill="none" stroke="#2b2318" strokeWidth="1.6" opacity=".5"/>
                  <circle cx="46" cy="47" r="5.5" fill="#fdf6e6" stroke="#2b2318" strokeWidth="1.6"/>
                  <circle cx="46" cy="47" r="2" fill="none" stroke="#b8492f" strokeWidth="1.4"/>
                  <ellipse cx="72" cy="46" rx="7" ry="4.5" fill="#f7ead2" stroke="#2b2318" strokeWidth="1.6"/>
                </svg>
  );
}
