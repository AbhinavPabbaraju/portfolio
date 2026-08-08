/** The Systems Diner facade: building, noren, lanterns, vending machine.
 *  Auto-ported from the legacy build; geometry preserved 1:1. */
export default function ShopFacade() {
  return (
    <svg className="shop" id="shopSvg" viewBox="0 0 1000 620" role="img"
                 aria-label="A tiny Japanese ramen shop at night — neon sign, paper lanterns, warm light in the serving window">
              <defs>
                <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0a0817"/><stop offset=".7" stopColor="#120e28"/>
                  <stop offset="1" stopColor="#1e1440"/>
                </linearGradient>
                <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1f1c3a"/><stop offset="1" stopColor="#16122c"/>
                </linearGradient>
                <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#292648"/><stop offset="1" stopColor="#1a1634"/>
                </linearGradient>
                <linearGradient id="woodG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4a3524"/><stop offset="1" stopColor="#291c11"/>
                </linearGradient>
                <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0e0b22"/><stop offset="1" stopColor="#08061a"/>
                </linearGradient>
                <linearGradient id="vmG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2e2b52"/><stop offset="1" stopColor="#1b1838"/>
                </linearGradient>
                <radialGradient id="winWarm" cx=".5" cy=".42" r=".75">
                  <stop offset="0" stopColor="#ffe0ae"/><stop offset=".55" stopColor="#f2a656"/>
                  <stop offset="1" stopColor="#a45a22"/>
                </radialGradient>
                <radialGradient id="lampG" cx=".5" cy=".5" r=".5">
                  <stop offset="0" stopColor="#ffd9a0" stopOpacity=".9"/><stop offset="1" stopColor="#ffd9a0" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="lanG" cx=".5" cy=".38" r=".7">
                  <stop offset="0" stopColor="#ffc36b"/><stop offset=".7" stopColor="#f28a2e"/>
                  <stop offset="1" stopColor="#b35714"/>
                </radialGradient>
                <filter id="glowN" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="glowB" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="8"/>
                </filter>
                <filter id="refB" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6"/>
                </filter>
              </defs>
    
              {/* ===== the shop ===== */}
              {/* wall */}
              <rect x="140" y="150" width="720" height="370" fill="url(#wallG)" stroke="#292546" strokeWidth="1.5"/>
              <g stroke="#3d3a60" strokeWidth="1" opacity=".1">
                <line x1="140" y1="196" x2="860" y2="196"/><line x1="140" y1="238" x2="860" y2="238"/>
                <line x1="140" y1="468" x2="860" y2="468"/><line x1="140" y1="496" x2="860" y2="496"/>
                <line x1="215" y1="150" x2="215" y2="240"/><line x1="770" y1="470" x2="770" y2="520"/>
              </g>
    
              {/* rooftop signboard */}
              <g>
                <line x1="340" y1="114" x2="340" y2="128" stroke="#2f2b52" strokeWidth="4"/>
                <line x1="660" y1="114" x2="660" y2="128" stroke="#2f2b52" strokeWidth="4"/>
                <rect x="292" y="34" width="416" height="80" rx="8" fill="#16122c" stroke="#2e4a60" strokeWidth="1.5"/>
                <text x="500" y="86" textAnchor="middle" className="neonP flick"
                      style={{fontFamily:'var(--f-serif)', fontWeight:'900', fontSize:'44px', letterSpacing:'.18em'}}>深夜食堂</text>
                <text x="500" y="106" textAnchor="middle" className="neonA"
                      style={{fontFamily:'var(--f-mono)', fontSize:'10.5px', letterSpacing:'.5em'}}>SYSTEMS DINER</text>
              </g>
    
              {/* awning roof */}
              <rect x="118" y="118" width="764" height="42" fill="url(#roofG)"/>
              <path d="M118,118 h764" stroke="#475a63" strokeWidth="2" opacity=".55"/>
              <g stroke="#0d0a1e" strokeWidth="2" opacity=".5">
                <line x1="158" y1="118" x2="158" y2="160"/><line x1="198" y1="118" x2="198" y2="160"/>
                <line x1="238" y1="118" x2="238" y2="160"/><line x1="278" y1="118" x2="278" y2="160"/>
                <line x1="318" y1="118" x2="318" y2="160"/><line x1="358" y1="118" x2="358" y2="160"/>
                <line x1="398" y1="118" x2="398" y2="160"/><line x1="438" y1="118" x2="438" y2="160"/>
                <line x1="478" y1="118" x2="478" y2="160"/><line x1="518" y1="118" x2="518" y2="160"/>
                <line x1="558" y1="118" x2="558" y2="160"/><line x1="598" y1="118" x2="598" y2="160"/>
                <line x1="638" y1="118" x2="638" y2="160"/><line x1="678" y1="118" x2="678" y2="160"/>
                <line x1="718" y1="118" x2="718" y2="160"/><line x1="758" y1="118" x2="758" y2="160"/>
                <line x1="798" y1="118" x2="798" y2="160"/><line x1="838" y1="118" x2="838" y2="160"/>
              </g>
              <path d="M118,160 h764" stroke="#ffcf9a" strokeWidth="1.4" opacity=".22"/>
              <rect x="140" y="160" width="720" height="24" fill="#000" opacity=".32"/>
    
              {/* AC unit on the roof */}
              <g>
                <rect x="764" y="88" width="72" height="28" rx="3" fill="#1e1b3c" stroke="#302c52" strokeWidth="1.5"/>
                <circle cx="786" cy="102" r="9" fill="none" stroke="#302c52" strokeWidth="2"/>
                <line x1="806" y1="94" x2="828" y2="94" stroke="#302c52" strokeWidth="2"/>
                <line x1="806" y1="102" x2="828" y2="102" stroke="#302c52" strokeWidth="2"/>
                <line x1="806" y1="110" x2="828" y2="110" stroke="#302c52" strokeWidth="2"/>
              </g>
    
              {/* string lights under the awning */}
              <path id="strEL" d="M146,166 C200,182 260,182 312,168" fill="none" stroke="#221f42" strokeWidth="1.6"/>
              <g filter="url(#glowN)">
                <circle cx="168" cy="172" r="3" fill="#ffd9a0"/><circle cx="200" cy="177" r="3" fill="#8fbcd4"/>
                <circle cx="232" cy="179" r="3" fill="#ffd9a0"/><circle cx="264" cy="177" r="3" fill="#ffd9a0"/>
                <circle cx="296" cy="172" r="3" fill="#8fbcd4"/>
              </g>
    
              {/* drain pipe */}
              <line x1="152" y1="150" x2="152" y2="520" stroke="#272348" strokeWidth="7"/>
              <line x1="148" y1="240" x2="156" y2="240" stroke="#322e56" strokeWidth="4"/>
              <line x1="148" y1="400" x2="156" y2="400" stroke="#322e56" strokeWidth="4"/>
              <path d="M152,520 q4,-60 0,-120" stroke="#0d0a20" strokeWidth="9" opacity=".35"/>
    
              {/* photo vending machine — one coin, one memory */}
              <g id="vendG">
                <rect className="vmGlow" x="156" y="294" width="104" height="230" fill="#8fbcd4" opacity=".07" filter="url(#glowB)"/>
                <rect x="166" y="300" width="84" height="218" rx="6" fill="url(#vmG)" stroke="#3b3766" strokeWidth="1.6"/>
                {/* lit header */}
                <rect x="171" y="306" width="74" height="15" rx="3" fill="#8fbcd4" opacity=".2"/>
                <text x="208" y="317.5" textAnchor="middle" fill="#ff8fcb" opacity=".92" filter="url(#glowN)"
                      style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'10.5px', letterSpacing:'.34em'}}>写真</text>
                {/* glass front, three shelves of photo canisters */}
                <rect x="173" y="328" width="52" height="102" rx="3" fill="#d7e6ed" opacity=".12"/>
                <g stroke="#4a4674" strokeWidth="1.2">
                  <line x1="175" y1="362" x2="223" y2="362"/><line x1="175" y1="396" x2="223" y2="396"/>
                </g>
                <g rx="2">
                  <rect x="178" y="342" width="9" height="18" rx="2.5" fill="#c96a4a" opacity=".9"/>
                  <rect x="191" y="342" width="9" height="18" rx="2.5" fill="#7fbfa0" opacity=".85"/>
                  <rect x="204" y="342" width="9" height="18" rx="2.5" fill="#5b93b3" opacity=".85"/>
                  <rect x="216" y="342" width="7" height="18" rx="2.5" fill="#d9b35a" opacity=".85"/>
                  <rect x="178" y="376" width="9" height="18" rx="2.5" fill="#d98ab0" opacity=".85"/>
                  <rect x="191" y="376" width="9" height="18" rx="2.5" fill="#6a8fd9" opacity=".8"/>
                  <rect x="204" y="376" width="9" height="18" rx="2.5" fill="#e3eef4" opacity=".8"/>
                  <rect x="216" y="376" width="7" height="18" rx="2.5" fill="#c96a4a" opacity=".8"/>
                  <rect x="178" y="410" width="9" height="16" rx="2.5" fill="#5b93b3" opacity=".8"/>
                  <rect x="191" y="410" width="9" height="16" rx="2.5" fill="#d9b35a" opacity=".8"/>
                  <rect x="204" y="410" width="9" height="16" rx="2.5" fill="#7fbfa0" opacity=".8"/>
                </g>
                <rect x="173" y="328" width="52" height="102" rx="3" fill="none" stroke="#4a4674" strokeWidth="1.4"/>
                <line x1="180" y1="334" x2="216" y2="424" stroke="#f0f6f9" strokeWidth="5" opacity=".05"/>
                {/* selector buttons + coin slot */}
                <rect x="231" y="330" width="12" height="48" rx="2.5" fill="#171432"/>
                <circle cx="237" cy="339" r="2.4" fill="#ff8fcb" opacity=".85"/>
                <circle cx="237" cy="352" r="2.4" fill="#5b93b3" opacity=".85"/>
                <circle cx="237" cy="365" r="2.4" fill="#86b0a6" opacity=".75"/>
                <rect x="231" y="386" width="12" height="20" rx="2.5" fill="#0e0b22" stroke="#3b3766" strokeWidth="1"/>
                <line x1="237" y1="391" x2="237" y2="401" stroke="#5a5686" strokeWidth="2"/>
                {/* dispensing hatch */}
                <rect x="176" y="452" width="64" height="34" rx="4" fill="#0e0b22" stroke="#3b3766" strokeWidth="1.4"/>
                <rect x="182" y="458" width="52" height="22" rx="3" fill="#191637"/>
                <rect x="176" y="496" width="64" height="3" fill="#3b3766" opacity=".6"/>
                <ellipse cx="208" cy="519" rx="46" ry="5" fill="#000" opacity=".4"/>
                {/* hover: the machine hums awake */}
                <rect className="vmBoost" x="164" y="298" width="88" height="222" rx="7" fill="#cfd0ee" opacity="0"/>
                <rect id="vmFlare" x="166" y="300" width="84" height="218" rx="6" fill="#eff5f9" opacity="0"/>
                <rect className="vmRing" x="160" y="294" width="96" height="230" rx="10" fill="none"
                      stroke="#8fbcd4" strokeWidth="2" filter="url(#glowN)"/>
              </g>
    
              {/* ===== serving window (warm heart of the scene) ===== */}
              <g id="winScene">
                <rect x="306" y="246" width="388" height="178" fill="url(#winWarm)"/>
                {/* back-wall fuda (menu strips) */}
                <g opacity=".95">
                  <g transform="translate(330,312)"><rect width="26" height="50" fill="#f6ecd6"/><rect width="26" height="6" fill="#b8492f"/><line x1="13" y1="14" x2="13" y2="42" stroke="#5a4a33" strokeWidth="2" opacity=".55"/></g>
                  <g transform="translate(366,312)"><rect width="26" height="50" fill="#f2e6cd"/><rect width="26" height="6" fill="#b8492f"/><line x1="13" y1="14" x2="13" y2="40" stroke="#5a4a33" strokeWidth="2" opacity=".45"/></g>
                  <g transform="translate(402,312)"><rect width="26" height="50" fill="#f6ecd6"/><rect width="26" height="6" fill="#b8492f"/><line x1="13" y1="14" x2="13" y2="44" stroke="#5a4a33" strokeWidth="2" opacity=".55"/></g>
                  <g transform="translate(438,312)"><rect width="26" height="50" fill="#f2e6cd"/><rect width="26" height="6" fill="#b8492f"/><line x1="13" y1="14" x2="13" y2="38" stroke="#5a4a33" strokeWidth="2" opacity=".5"/></g>
                  <g transform="translate(474,312)"><rect width="26" height="50" fill="#f6ecd6"/><rect width="26" height="6" fill="#b8492f"/><line x1="13" y1="14" x2="13" y2="42" stroke="#5a4a33" strokeWidth="2" opacity=".55"/></g>
                </g>
                {/* pendant lamps */}
                <g>
                  <line x1="540" y1="246" x2="540" y2="288" stroke="#3a2a18" strokeWidth="2.5"/>
                  <path d="M527,288 L553,288 L546,300 L534,300 Z" fill="#2e2114"/>
                  <circle cx="540" cy="306" r="6" fill="#ffdca4"/>
                  <circle cx="540" cy="308" r="22" fill="url(#lampG)"/>
                </g>
                <g>
                  <line x1="628" y1="246" x2="628" y2="282" stroke="#3a2a18" strokeWidth="2.5"/>
                  <path d="M615,282 L641,282 L634,294 L622,294 Z" fill="#2e2114"/>
                  <circle cx="628" cy="300" r="6" fill="#ffdca4"/>
                  <circle cx="628" cy="302" r="22" fill="url(#lampG)"/>
                </g>
                {/* stock pot, simmering since noon */}
                <g>
                  <rect x="596" y="376" width="62" height="34" rx="5" fill="#241a10"/>
                  <rect x="592" y="372" width="70" height="8" rx="4" fill="#33251636"/>
                  <rect x="592" y="370" width="70" height="8" rx="4" fill="#3a2a18"/>
                  <path className="stm" d="M612,362 C610,352 616,346 612,336 C610,330 614,326 612,318"/>
                  <path className="stm b" d="M628,364 C626,354 632,348 628,338 C626,332 630,328 628,320"/>
                  <path className="stm c" d="M644,362 C642,352 648,346 644,336 C642,330 646,326 644,318"/>
                </g>
                {/* inner counter band */}
                <rect x="306" y="402" width="388" height="22" fill="#3a2818"/>
                <path d="M306,402 h388" stroke="#ffcd8c" strokeWidth="1.4" opacity=".4"/>
                {/* hover: warm boost + inviting ring */}
                <rect className="winBoost" x="296" y="236" width="408" height="198" fill="url(#winWarm)"/>
                <rect id="winFlare" x="306" y="246" width="388" height="178" fill="#fff2d8"/>
                <rect className="winRing" x="299" y="239" width="402" height="212" rx="9" fill="none"
                      stroke="#8fbcd4" strokeWidth="2" filter="url(#glowN)"/>
              </g>
    
              {/* noren curtain over the window */}
              <g id="noren">
                <rect x="302" y="240" width="396" height="6" rx="3" fill="#151e23"/>
                <g className="np"><rect x="310" y="246" width="90" height="62" fill="#242c52" stroke="#161a33" strokeWidth="1.5"/>
                  <text x="355" y="288" textAnchor="middle" fill="#e6f0f5" opacity=".92" style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'30px'}}>ら</text></g>
                <g className="np"><rect x="406" y="246" width="90" height="68" fill="#222a4e" stroke="#161a33" strokeWidth="1.5"/>
                  <text x="451" y="292" textAnchor="middle" fill="#e6f0f5" opacity=".92" style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'30px'}}>ー</text></g>
                <g className="np"><rect x="502" y="246" width="90" height="64" fill="#242c52" stroke="#161a33" strokeWidth="1.5"/>
                  <text x="547" y="290" textAnchor="middle" fill="#e6f0f5" opacity=".92" style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'30px'}}>め</text></g>
                <g className="np"><rect x="598" y="246" width="90" height="66" fill="#222a4e" stroke="#161a33" strokeWidth="1.5"/>
                  <text x="643" y="291" textAnchor="middle" fill="#e6f0f5" opacity=".92" style={{fontFamily:'var(--f-serif)', fontWeight:'700', fontSize:'30px'}}>ん</text></g>
              </g>
              {/* window frame */}
              <rect x="300" y="240" width="400" height="188" fill="none" stroke="#0e0b22" strokeWidth="9"/>
              <rect x="300" y="240" width="400" height="188" fill="none" stroke="#383468" strokeWidth="2"/>
    
              {/* counter ledge + stools */}
              <rect x="288" y="426" width="424" height="24" rx="4" fill="url(#woodG)"/>
              <path d="M292,428 h416" stroke="#ffcd8c" strokeWidth="1.6" opacity=".35"/>
              <rect x="298" y="450" width="404" height="7" fill="#1a1310"/>
              <g fill="#151228">
                <ellipse cx="330" cy="422" rx="14" ry="5"/>
                <path d="M318,422 a12,9 0 0 0 24,0 Z"/>
                <rect x="672" y="404" width="12" height="20" rx="2"/>
              </g>
              <g>
                <ellipse cx="382" cy="466" rx="26" ry="8" fill="#302c58"/>
                <path d="M356,466 a26,8 0 0 0 52,0" fill="#252148"/>
                <line x1="368" y1="472" x2="362" y2="518" stroke="#1d1a3e" strokeWidth="4"/>
                <line x1="396" y1="472" x2="402" y2="518" stroke="#1d1a3e" strokeWidth="4"/>
                <line x1="382" y1="474" x2="382" y2="518" stroke="#181534" strokeWidth="4"/>
              </g>
              <g>
                <ellipse cx="590" cy="466" rx="26" ry="8" fill="#302c58"/>
                <path d="M564,466 a26,8 0 0 0 52,0" fill="#252148"/>
                <line x1="576" y1="472" x2="570" y2="518" stroke="#1d1a3e" strokeWidth="4"/>
                <line x1="604" y1="472" x2="610" y2="518" stroke="#1d1a3e" strokeWidth="4"/>
                <line x1="590" y1="474" x2="590" y2="518" stroke="#181534" strokeWidth="4"/>
              </g>
    
              {/* sliding door, lit from inside */}
              <g>
                <rect x="716" y="268" width="82" height="252" fill="#191636" stroke="#2e4a60" strokeWidth="2"/>
                <rect x="724" y="278" width="66" height="130" fill="#d98a3f" opacity=".82"/>
                <g stroke="#191636" strokeWidth="3">
                  <line x1="757" y1="278" x2="757" y2="408"/>
                  <line x1="724" y1="322" x2="790" y2="322"/><line x1="724" y1="366" x2="790" y2="366"/>
                </g>
                <rect x="724" y="416" width="66" height="96" fill="#221f42"/>
                <rect x="750" y="440" width="5" height="28" rx="2" fill="#3e4478"/>
              </g>
    
              {/* vertical neon: 夜 */}
              <g>
                <line x1="812" y1="150" x2="812" y2="190" stroke="#2f2b52" strokeWidth="3"/>
                <rect x="806" y="188" width="52" height="118" rx="7" fill="#151228" stroke="#312d56" strokeWidth="1.5"/>
                <rect x="811" y="193" width="42" height="108" rx="5" fill="none" stroke="#8fbcd4" strokeWidth="1.4" opacity=".7" filter="url(#glowN)"/>
                <text x="832" y="262" textAnchor="middle" className="neonA flick2"
                      style={{fontFamily:'var(--f-serif)', fontWeight:'900', fontSize:'34px'}}>夜</text>
              </g>
    
              {/* paper lanterns */}
              <g className="sway">
                <line x1="262" y1="160" x2="262" y2="182" stroke="#241a12" strokeWidth="2.5"/>
                <circle className="lanGlow" cx="262" cy="216" r="42" fill="#f28a2e" opacity=".32" filter="url(#glowB)"/>
                <rect x="252" y="180" width="20" height="7" rx="2" fill="#241a12"/>
                <path d="M240,214 C240,196 248,186 262,186 C276,186 284,196 284,214 C284,232 276,242 262,242 C248,242 240,232 240,214 Z" fill="url(#lanG)"/>
                <g stroke="#a34d10" strokeWidth="1.3" fill="none" opacity=".55">
                  <path d="M241,202 C250,199 274,199 283,202"/><path d="M240,214 C250,211 274,211 284,214"/>
                  <path d="M241,226 C250,229 274,229 283,226"/>
                </g>
                <text x="262" y="223" textAnchor="middle" fill="#7a2f0c" style={{fontFamily:'var(--f-serif)', fontWeight:'900', fontSize:'19px'}}>麺</text>
                <rect x="254" y="241" width="16" height="6" rx="2" fill="#241a12"/>
              </g>
              <g className="sway s2">
                <line x1="748" y1="160" x2="748" y2="176" stroke="#241a12" strokeWidth="2.5"/>
                <circle className="lanGlow" cx="748" cy="208" r="38" fill="#f28a2e" opacity=".32" filter="url(#glowB)"/>
                <rect x="739" y="174" width="18" height="7" rx="2" fill="#241a12"/>
                <path d="M728,206 C728,190 735,181 748,181 C761,181 768,190 768,206 C768,222 761,231 748,231 C735,231 728,222 728,206 Z" fill="url(#lanG)"/>
                <g stroke="#a34d10" strokeWidth="1.2" fill="none" opacity=".55">
                  <path d="M729,196 C737,193 759,193 767,196"/><path d="M728,206 C737,203 759,203 768,206"/>
                  <path d="M729,216 C737,219 759,219 767,216"/>
                </g>
                <text x="748" y="214" textAnchor="middle" fill="#7a2f0c" style={{fontFamily:'var(--f-serif)', fontWeight:'900', fontSize:'17px'}}>ラ</text>
                <rect x="741" y="230" width="14" height="6" rx="2" fill="#241a12"/>
              </g>
    
              {/* chalkboard, tonight's specials — leaning by the counter now */}
              <g className="sway s3" style={{transformOrigin:'50% 100%'}}>
                <rect x="262" y="398" width="80" height="100" rx="5" fill="#5a4a30"/>
                <rect x="268" y="404" width="68" height="88" rx="3" fill="#14112a"/>
                <g stroke="#cfd6e4" strokeWidth="1.8" fill="none" opacity=".7" strokeLinecap="round">
                  <path d="M278,418 h30"/><path d="M278,432 h46"/><path d="M278,446 h38"/>
                </g>
                <path d="M278,464 C288,458 300,466 312,460" stroke="#8fbcd4" strokeWidth="2" fill="none" opacity=".85" strokeLinecap="round"/>
                <path d="M278,478 h24" stroke="#ff8fcb" strokeWidth="1.8" fill="none" opacity=".7" strokeLinecap="round"/>
                <line x1="272" y1="498" x2="264" y2="524" stroke="#3a2f1e" strokeWidth="4"/>
                <line x1="332" y1="498" x2="340" y2="524" stroke="#3a2f1e" strokeWidth="4"/>
              </g>
    
              {/* ===== wet street (surface provided by the shared street plane) ===== */}
              {/* light spill from window + door */}
              <polygon points="306,518 694,518 760,610 250,610" fill="#f2a656" opacity=".07"/>
              <polygon points="716,518 798,518 850,610 700,610" fill="#d98a3f" opacity=".06"/>
              {/* blurred reflections */}
              <g filter="url(#refB)">
                <rect x="316" y="524" width="368" height="66" fill="url(#winWarm)" opacity=".16"/>
                <rect x="726" y="524" width="62" height="52" fill="#d98a3f" opacity=".14"/>
                <circle cx="262" cy="546" r="20" fill="#f28a2e" opacity=".14"/>
                <circle cx="748" cy="540" r="17" fill="#f28a2e" opacity=".12"/>
                <rect x="812" y="524" width="40" height="58" fill="#8fbcd4" opacity=".1"/>
                <rect x="380" y="524" width="240" height="40" fill="#ff8fcb" opacity=".05"/>
                <rect x="170" y="524" width="76" height="46" fill="#8fbcd4" opacity=".08"/>
              </g>
              <g opacity=".55">
                <rect x="352" y="528" width="2.5" height="52" fill="#ffd9a0" opacity=".28"/>
                <rect x="452" y="530" width="2" height="64" fill="#ffe7c4" opacity=".22"/>
                <rect x="548" y="526" width="2.5" height="46" fill="#ffd9a0" opacity=".26"/>
                <rect x="642" y="530" width="2" height="58" fill="#ffcf9a" opacity=".2"/>
                <rect x="830" y="526" width="2" height="44" fill="#8fbcd4" opacity=".26"/>
                <rect x="756" y="528" width="2" height="40" fill="#ffb56b" opacity=".22"/>
              </g>
              <ellipse cx="380" cy="588" rx="66" ry="8" fill="#5b93b3" opacity=".05"/>
              <path d="M318,585 a64,8 0 0 1 124,0" fill="none" stroke="#8fbcd4" strokeWidth="1.2" opacity=".22"/>
              <ellipse cx="646" cy="602" rx="88" ry="9" fill="#ff8fcb" opacity=".04"/>
              <path d="M562,600 a86,9 0 0 1 168,0" fill="none" stroke="#ff8fcb" strokeWidth="1.2" opacity=".18"/>
    
              {/* street vent steam, stage right */}
              <g>
                <rect x="826" y="506" width="34" height="12" rx="2" fill="#171434" stroke="#292546" strokeWidth="1.4"/>
                <path className="stm b" d="M836,500 C832,486 842,478 836,464 C832,454 840,448 836,436" opacity=".5"/>
                <path className="stm" d="M850,502 C846,488 856,480 850,466 C846,456 854,450 850,438" opacity=".5"/>
              </g>
            </svg>
  );
}
