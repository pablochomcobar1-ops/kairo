import { Monogram, Wordmark } from "./Logo";

/**
 * First-visit intro: the K monogram draws its rings, then the K, the wordmark
 * fades up, and the whole thing lifts away (~2 s). Pure CSS, so it plays and
 * clears even before JavaScript loads and can never get stuck.
 * Plays at most once every 12 hours, in any tab (INTRO_SCRIPT), and never under reduced motion.
 * It never blocks clicks (pointer-events: none).
 */
export function Loader() {
  return (
    <div className="intro" aria-hidden="true">
      <Monogram size={112} className="intro-mono" />
      <Wordmark className="intro-word text-heading02" />
    </div>
  );
}

/** How long after one intro before it can play again. */
export const INTRO_EVERY_MS = 12 * 60 * 60 * 1000;

/**
 * Runs before the first paint (inline in <head>) so a returning visitor never
 * sees the intro flash, including in new tabs. If storage is blocked, the intro
 * is skipped rather than replayed on every page. Stage 5 adds a CSP nonce to it.
 */
export const INTRO_SCRIPT = `try{var k="kairo-intro",n=Date.now(),t=+localStorage.getItem(k)||0;if(n-t<${INTRO_EVERY_MS}){document.documentElement.classList.add("intro-seen")}else{localStorage.setItem(k,String(n))}}catch(e){document.documentElement.classList.add("intro-seen")}`;
