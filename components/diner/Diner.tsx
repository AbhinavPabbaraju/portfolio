"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { refreshDeck, scrollToTarget, scrollToY } from "@/lib/lenis";
import { PROJECTS, type Project } from "@/lib/data/projects";
import { GROUND, SHOP_UNITS, VB_BOTTOM, VB_H, VB_W } from "@/lib/diner/scene";
import Backdrop from "./Backdrop";
import Overhead from "./Overhead";
import ShopFacade from "./ShopFacade";
import RainCanvas from "./RainCanvas";
import RainAudio from "./RainAudio";
import MenuCard from "./MenuCard";
import MenuFlourish from "./MenuFlourish";
import ServeOverlay from "./ServeOverlay";
import PhotoGallery from "./PhotoGallery";
import SectionHead from "@/components/ui/SectionHead";

type Mode = null | "menu" | "photo";

/** The Systems Diner — exterior street, cinematic entries, service.
 *  GSAP owns every long timeline; React owns the state machine. */
export default function Diner() {
  const section = useRef<HTMLElement>(null);
  const exterior = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const inside = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const leaveBtn = useRef<HTMLButtonElement>(null);
  const photoInside = useRef<HTMLDivElement>(null);
  const serve = useRef<HTMLDivElement>(null);
  const wires = useRef<HTMLDivElement>(null);
  const winBtn = useRef<HTMLButtonElement>(null);
  const vendBtn = useRef<HTMLButtonElement>(null);

  const state = useRef({ mode: null as Mode, busy: false });
  const [servedProject, setServedProject] = useState<Project | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);
  const lastTaste = useRef<HTMLButtonElement | null>(null);
  const reduce = useRef(false);

  /* — one road for everyone —
     The stage is a full-viewport frame and both scene planes cover it, so the
     artwork's scale is the frame's, not the shop's. This puts the shop on it:
     `SHOP_UNITS` wide *in grid units*, standing with its own street line (the
     wall ends 83.55% down its 1000×620 face) on the artwork's road.

     Sizing the shop from the same scale as the street is the whole trick. As
     a fixed pixel width it stayed put while the artwork grew with the window,
     so a wide screen blew the street up around it — poles wandering onto the
     facade, sky scaled off the top of the frame. Tied together, the picture is
     the same picture at every size and only its resolution changes. */
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sync = () => {
      const ex = exterior.current, st = stage.current;
      if (!ex || !st) return;
      const w = ex.clientWidth, h = ex.clientHeight;
      if (!w || !h) return;
      /* `slice` scales to cover and anchors the bottom (xMidYMax), so this is
         the artwork's scale and the road is a fixed distance off the floor. */
      const scale = Math.max(w / VB_W, h / VB_H);
      const ground = h - (VB_BOTTOM - GROUND) * scale;
      /* On a phone the grid is cropped so hard that a shop scaled off it
         would be wider than the window; the gutter is the floor. */
      const pad = Math.min(64, Math.max(20, w * 0.05));
      const sw = Math.min(SHOP_UNITS * scale, w - 2 * pad);
      st.style.width = sw + "px";
      st.style.marginLeft = -sw / 2 + "px";       // `left:50%` is the CSS's
      st.style.top = ground - sw * 0.62 * 0.8355 + "px";
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("load", sync);
    /* The frame is sized in `svh` and the stage in `aspect-ratio`; neither is
       final until layout has run at least once, and a web font landing later
       reflows the section above it. */
    const ro = new ResizeObserver(sync);
    if (exterior.current) ro.observe(exterior.current);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("load", sync);
    };
  }, []);

  const snapToWork = useCallback(() => {
    if (!section.current) return;
    scrollToY(section.current.getBoundingClientRect().top + window.pageYOffset);
  }, []);

  const setWarm = (cls: "warm" | "vwarm", on: boolean) => {
    if (state.current.mode === null) stage.current?.classList.toggle(cls, on);
  };

  /* ---- enter the menu: camera pushes in, noren parts, menu unfolds ---- */
  const enter = useCallback((instant: boolean, done?: () => void) => {
    const s = state.current;
    if (s.mode !== null || s.busy) { done?.(); return; }
    s.busy = true;
    const finish = () => {
      s.mode = "menu"; s.busy = false;
      card.current?.classList.add("stamped");
      if (leaveBtn.current) gsap.set(leaveBtn.current, { opacity: 1 });
      refreshDeck();
      snapToWork();
      done?.();
    };
    if (instant || reduce.current) {
      exterior.current!.hidden = true;
      inside.current!.hidden = false;
      gsap.set([counter.current, card.current, leaveBtn.current], { clearProps: "all" });
      finish();
      return;
    }
    stage.current!.classList.remove("warm", "vwarm");
    winBtn.current!.style.pointerEvents = "none";
    vendBtn.current!.style.pointerEvents = "none";
    const strips = stage.current!.querySelectorAll("#noren .np");
    const flare = stage.current!.querySelector("#winFlare");
    gsap.set(counter.current, { scaleY: 0, transformOrigin: "50% 100%" });
    gsap.set(card.current, { rotationX: -74, y: -26, opacity: 0, transformOrigin: "50% 0%" });
    gsap.set(leaveBtn.current, { opacity: 0 });

    gsap.timeline({ onComplete: finish })
      .to(veil.current, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, 0)
      /* The veil lives inside the stage, so it can only darken the stage.
         The overhead plane is a sibling *above* it and would otherwise stay
         lit while the whole street around it went out — it dims on the
         veil's own curve instead. */
      .to(wires.current, { opacity: 0, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(stage.current, { scale: 2.3, duration: 1.55, ease: "power2.inOut" }, 0)
      .to(strips, { yPercent: -115, opacity: 0, duration: 0.75, stagger: 0.08, ease: "power2.in" }, 0.45)
      .to(flare, { opacity: 0.5, duration: 0.4, ease: "power1.in" }, 0.8)
      .to(exterior.current, { opacity: 0, duration: 0.5, ease: "power1.in" }, 1.15)
      .add(() => { exterior.current!.hidden = true; inside.current!.hidden = false; }, 1.66)
      .to(counter.current, { scaleY: 1, duration: 0.6, ease: "power3.out" }, 1.72)
      .to(card.current, { rotationX: 0, y: 0, opacity: 1, duration: 1.05, ease: "power3.out" }, 1.9)
      .to(leaveBtn.current, { opacity: 1, duration: 0.4 }, 2.7);
  }, [snapToWork]);

  /* ---- leave: step back out into the rain ---- */
  const leave = useCallback(() => {
    const s = state.current;
    if (s.mode !== "menu" || s.busy) return;
    s.busy = true;
    closeServe(true);
    const finish = () => {
      inside.current!.hidden = true;
      exterior.current!.hidden = false;
      s.mode = null; s.busy = false;
      winBtn.current!.style.pointerEvents = "";
      vendBtn.current!.style.pointerEvents = "";
      card.current?.classList.remove("stamped");
      gsap.set(exterior.current, { opacity: 1 });
      gsap.set(stage.current, { scale: 1 });
      gsap.set([veil.current, wires.current], { clearProps: "opacity" });
      gsap.set(veil.current, { opacity: 0 });
      gsap.set(stage.current!.querySelector("#winFlare"), { opacity: 0 });
      gsap.set(stage.current!.querySelectorAll("#noren .np"), { yPercent: 0, opacity: 1 });
      gsap.set([counter.current, card.current, leaveBtn.current], { clearProps: "all" });
      refreshDeck();
      snapToWork();
      winBtn.current?.focus({ preventScroll: true });
    };
    if (reduce.current) { finish(); return; }
    gsap.to(inside.current, {
      opacity: 0, duration: 0.5, ease: "power1.inOut",
      onComplete: () => {
        gsap.set(inside.current, { clearProps: "opacity" });
        finish();
        gsap.fromTo(exterior.current, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out" });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapToWork]);

  /* ---- the vending machine: coin in, photographs out ---- */
  const enterVend = useCallback(() => {
    const s = state.current;
    if (s.mode !== null || s.busy) return;
    s.busy = true;
    const finish = () => {
      s.mode = "photo"; s.busy = false;
      setPhotoVisible(true);
      refreshDeck();
      snapToWork();
    };
    if (reduce.current) {
      exterior.current!.hidden = true;
      photoInside.current!.hidden = false;
      finish();
      return;
    }
    stage.current!.classList.remove("warm", "vwarm");
    winBtn.current!.style.pointerEvents = "none";
    vendBtn.current!.style.pointerEvents = "none";
    stage.current!.style.transformOrigin = "20.8% 66%";
    const flare = stage.current!.querySelector("#vmFlare");
    const photoCard = photoInside.current!.querySelector("#photoCard");
    gsap.set(photoCard, { rotationX: -74, y: -26, opacity: 0, transformOrigin: "50% 0%" });
    gsap.timeline({ onComplete: finish })
      .to(veil.current, { opacity: 1, duration: 1.05, ease: "power2.inOut" }, 0)
      .to(wires.current, { opacity: 0, duration: 1.05, ease: "power2.inOut" }, 0)
      .to(stage.current, { scale: 2.7, duration: 1.5, ease: "power2.inOut" }, 0)
      .to(flare, { opacity: 0.55, duration: 0.4, ease: "power1.in" }, 0.75)
      .to(exterior.current, { opacity: 0, duration: 0.5, ease: "power1.in" }, 1.1)
      .add(() => { exterior.current!.hidden = true; photoInside.current!.hidden = false; }, 1.58)
      .to(photoCard, { rotationX: 0, y: 0, opacity: 1, duration: 1, ease: "power3.out" }, 1.66);
  }, [snapToWork]);

  const leaveVend = useCallback(() => {
    const s = state.current;
    if (s.mode !== "photo" || s.busy) return;
    s.busy = true;
    const finish = () => {
      photoInside.current!.hidden = true;
      exterior.current!.hidden = false;
      s.mode = null; s.busy = false;
      setPhotoVisible(false);
      winBtn.current!.style.pointerEvents = "";
      vendBtn.current!.style.pointerEvents = "";
      stage.current!.style.transformOrigin = "";
      gsap.set(exterior.current, { opacity: 1 });
      gsap.set(stage.current, { scale: 1 });
      gsap.set([veil.current, wires.current], { clearProps: "opacity" });
      gsap.set(veil.current, { opacity: 0 });
      gsap.set(stage.current!.querySelector("#vmFlare"), { opacity: 0 });
      gsap.set(photoInside.current!.querySelector("#photoCard"), { clearProps: "all" });
      refreshDeck();
      snapToWork();
      vendBtn.current?.focus({ preventScroll: true });
    };
    if (reduce.current) { finish(); return; }
    gsap.to(photoInside.current, {
      opacity: 0, duration: 0.5, ease: "power1.inOut",
      onComplete: () => {
        gsap.set(photoInside.current, { clearProps: "opacity" });
        finish();
        gsap.fromTo(exterior.current, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out" });
      },
    });
  }, [snapToWork]);

  /* ---- service: a bowl slides across the counter, becomes the project ---- */
  const serveTl = useRef<gsap.core.Timeline | null>(null);
  const serveDish = useCallback((p: Project, btn: HTMLButtonElement) => {
    lastTaste.current = btn;
    setServedProject(p);
    const el = serve.current!;
    el.hidden = false;
    const bowl = el.querySelector(".s-bowl");
    const detail = el.querySelector(".serve-detail");
    const close = el.querySelector<HTMLButtonElement>(".serve-close");

    /* The overlay covers the whole menu card, and the service plays out near
       its top — so from dish four you were watching three seconds of blank
       paper. The close button then pulled you up there itself: a bare
       `focus()` scrolls natively, which is the one thing Lenis has to own.
       Travel first, on our own curve, and focus without moving anything. */
    if (card.current) scrollToTarget(card.current);

    if (reduce.current) {
      gsap.set(bowl, { opacity: 0 });
      gsap.set(detail, { opacity: 1 });
      close?.focus({ preventScroll: true });
      return;
    }
    const travel = card.current!.clientWidth * 0.5 + (bowl as HTMLElement).clientWidth;
    gsap.set(el, { opacity: 0 });
    gsap.set(bowl, { x: travel, y: 0, scale: 1, opacity: 1 });
    gsap.set(detail, { opacity: 0, y: 18 });
    serveTl.current = gsap.timeline({ onComplete: () => close?.focus({ preventScroll: true }) })
      .to(el, { opacity: 1, duration: 0.3, ease: "power1.out" })
      .to(bowl, { x: 0, duration: 1.2, ease: "power3.out" }, 0.15)
      .to(bowl, { y: -5, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.out" }, 1.1)
      .to(bowl, { scale: 1.65, opacity: 0, y: -16, transformOrigin: "50% 60%", duration: 0.75, ease: "power2.in" }, 1.85)
      .to(detail, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }, 2.15);
  }, []);

  const closeServe = useCallback((instant = false) => {
    const el = serve.current;
    if (!el || el.hidden) return;
    serveTl.current?.kill();
    const done = () => {
      el.hidden = true;
      gsap.set([el, el.querySelector(".s-bowl"), el.querySelector(".serve-detail")], { clearProps: "all" });
      lastTaste.current?.focus({ preventScroll: true });
      lastTaste.current = null;
      /* Unmount the detail rather than leaving it behind a `hidden`.
         Phalanx's serving carries a running simulation, and this is what
         tears its rAF loop and observer down. */
      setServedProject(null);
    };
    if (instant || reduce.current) { done(); return; }
    gsap.to(el, { opacity: 0, duration: 0.4, ease: "power1.inOut", onComplete: done });
  }, []);

  /* ---- global wiring: Escape + carousel routing ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dialog = serve.current;
      const serving = !!dialog && !dialog.hidden;

      /* The serve is a dialog laid over the menu, so Tab has to stay inside
         it — otherwise the next tab lands on a dish you can't see. The stop
         list has to cover everything focusable a serving can hold, not just
         links and buttons: Phalanx's brings a slider and five SVG nodes. */
      if (e.key === "Tab" && serving) {
        const stops = dialog!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!stops.length) return;
        const first = stops[0], last = stops[stops.length - 1];
        const here = document.activeElement;
        const outside = !dialog!.contains(here);
        if (e.shiftKey ? here === first || outside : here === last || outside) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus({ preventScroll: true });
        }
        return;
      }

      if (e.key !== "Escape") return;
      if (serving) { closeServe(); return; }
      const s = state.current;
      if (s.busy) return;
      if (s.mode === "photo") leaveVend();
      else if (s.mode === "menu") leave();     // parity: Escape leaves either room
    };
    document.addEventListener("keydown", onKey);

    (window as unknown as { gotoDish?: (sel: string) => void }).gotoDish = (sel) => {
      const flash = () => {
        const el = document.querySelector(sel);
        if (!el) return;
        scrollToTarget(el as HTMLElement, { block: "center" });
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 1600);
      };
      const s = state.current;
      if (s.mode !== null) {
        if (s.mode === "photo") {
          photoInside.current!.hidden = true;
          inside.current!.hidden = false;
          s.mode = "menu";
          card.current?.classList.add("stamped");
          gsap.set([counter.current, card.current, leaveBtn.current], { clearProps: "all" });
          stage.current!.style.transformOrigin = "";
          refreshDeck();
        }
        setTimeout(flash, 60);
        return;
      }
      if (section.current) scrollToTarget(section.current);
      enter(reduce.current, () => setTimeout(flash, reduce.current ? 60 : 250));
    };
    return () => {
      document.removeEventListener("keydown", onKey);
      delete (window as unknown as { gotoDish?: unknown }).gotoDish;
    };
  }, [enter, leave, leaveVend, closeServe]);

  return (
    <section className="block cafe" id="work" ref={section}>
      <div className="wrap">
        <SectionHead
          title={<>Come in.<br />We’re open late.</>}
          aside="a Tokyo backstreet · 23:47 · still raining"
        />

        {/* EXTERIOR — the building is the UI */}
        <div className="cafe-exterior" id="cafeExterior" ref={exterior}>
          <div className="cafe-backdrop" aria-hidden><Backdrop /></div>
          <div className="cafe-stage" id="cafeStage" ref={stage}>
            <ShopFacade />
            <div className="cafe-veil" ref={veil} aria-hidden />
            <button
              className="serve-window" ref={winBtn}
              aria-label="Slide open the serving window to see tonight’s menu"
              onMouseEnter={() => setWarm("warm", true)} onMouseLeave={() => setWarm("warm", false)}
              onFocus={() => setWarm("warm", true)} onBlur={() => setWarm("warm", false)}
              onClick={() => enter(false)}
            >
              <span className="sw-hint" aria-hidden><span className="hand">こんばんは — slide the window open</span></span>
            </button>
            <button
              className="vend-window" ref={vendBtn}
              aria-label="Use the photo vending machine to see the photography collection"
              onMouseEnter={() => setWarm("vwarm", true)} onMouseLeave={() => setWarm("vwarm", false)}
              onFocus={() => setWarm("vwarm", true)} onBlur={() => setWarm("vwarm", false)}
              onClick={enterVend}
            >
              <span className="vw-hint" aria-hidden><span className="hand">one coin, one photo</span></span>
            </button>
          </div>
          {/* The near plane, over the facade: the poles stand on the kerb in
              front of the shop and their cables cross its roofline. */}
          <div className="cafe-wires" ref={wires} aria-hidden><Overhead /></div>
          <RainCanvas />
          <a className="alley-link" href="#writing" aria-label="Follow the alley to the Writing section">
            <svg viewBox="0 0 34 26" aria-hidden>
              <path className="scrib live" d="M8,24 C16,16 20,12 27,5 M18,5 L28,4 L27,14" strokeWidth={2} />
            </svg>
            <span className="hand">psst — the alley leads<br />to my field notes</span>
          </a>
          <p className="cafe-cap">the kitchen never closes · five dishes on tonight · counter seats only</p>
        </div>

        {/* INTERIOR — counter + the menu */}
        <div className="cafe-inside" ref={inside} hidden>
          <div className="counter-top" ref={counter} aria-hidden />
          <div className="menu-scene">
            <div className="neon-sign" aria-hidden>営業中</div>
            {/* the room either side of the menu — dead margin until now */}
            <MenuFlourish side="left" />
            <MenuFlourish side="right" />
            <div className="fold-wrap">
              <MenuCard ref={card} onTaste={serveDish}>
                <ServeOverlay ref={serve} project={servedProject} onClose={() => closeServe()} />
              </MenuCard>
            </div>
          </div>
          <button className="leave" ref={leaveBtn} type="button" onClick={leave}>← step back outside</button>
        </div>

        {/* INSIDE THE MACHINE — the photo collection */}
        <PhotoGallery ref={photoInside} visible={photoVisible} onLeave={leaveVend} />
      </div>

      {/* Outside `.wrap`, so it anchors to the section rather than the column
          and survives all three modes — the bed keeps playing behind the menu
          and the photo machine, and the control has to stay reachable for as
          long as it does. */}
      <RainAudio />
    </section>
  );
}
