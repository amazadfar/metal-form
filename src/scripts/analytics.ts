/**
 * Analytics event plumbing.
 *
 * No provider is connected. What exists is the wiring: every call to action,
 * industry link and language switch already carries a `data-analytics`
 * attribute, and this module turns those into a single, consistently-named
 * event stream. Connecting a provider later is one function, not a sweep
 * through forty components.
 *
 * Nothing personal is collected and nothing is sent anywhere until
 * FEATURES.analytics is switched on in src/config/site.ts.
 */
import { FEATURES } from '../config/site.ts';

export interface MetalFormEvent {
  name: string;
  locale: string;
  /** Route without the locale prefix. */
  route: string;
  /** For a WhatsApp CTA: whether it opened WhatsApp or fell back to /contact/. */
  channel?: string;
  /** Scroll depth as a percentage, in 25% steps. */
  depth?: number;
}

declare global {
  interface Window {
    /** Queue of events captured before a provider is attached. */
    __mf_events?: MetalFormEvent[];
    /** Set by a provider integration to receive events live. */
    __mf_sink?: (e: MetalFormEvent) => void;
  }
}

function emit(event: MetalFormEvent) {
  if (window.__mf_sink) {
    try { window.__mf_sink(event); } catch { /* a provider must never break the page */ }
    return;
  }
  // Held in memory so a provider attached later can drain the session.
  (window.__mf_events ||= []).push(event);
  if (!FEATURES.analytics && import.meta.env.DEV) {
    console.debug('[analytics]', event.name, event);
  }
}

const context = () => {
  const parts = location.pathname.split('/').filter(Boolean);
  return {
    locale: parts[0] ?? 'root',
    route: parts.slice(1).join('/') || 'home',
  };
};

/** Click-through on anything carrying a `data-analytics` name. */
function trackClicks() {
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-analytics]');
      if (!el) return;
      emit({
        name: el.dataset.analytics!,
        ...context(),
        ...(el.dataset.channel ? { channel: el.dataset.channel } : {}),
      });
    },
    { capture: true, passive: true },
  );
}

/** Scroll depth in quarters. Fires once per threshold per page. */
function trackDepth() {
  const fired = new Set<number>();
  const check = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.round(((window.scrollY / scrollable) * 100) / 25) * 25;
    if (pct > 0 && pct <= 100 && !fired.has(pct)) {
      fired.add(pct);
      emit({ name: 'scroll_depth', ...context(), depth: pct });
    }
  };
  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; check(); });
    },
    { passive: true },
  );
}

export function initAnalytics() {
  const ctx = context();
  emit({ name: 'page_view', ...ctx });
  trackClicks();
  trackDepth();
}
