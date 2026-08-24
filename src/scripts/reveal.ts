/**
 * Scroll reveal + scroll-linked sequences.
 *
 * Written as progressive enhancement: the `js` class is what allows anything to
 * be hidden in the first place, so a visitor with a failed script, an old
 * browser or reduced-motion enabled still reads a complete page.
 */

const REVEAL_ATTR = 'data-reveal';

function initReveal() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}]`));
  if (!targets.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.setAttribute(REVEAL_ATTR, 'in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.setAttribute(REVEAL_ATTR, 'in');
        io.unobserve(el);
        // Stagger is expressed as a delay so a group animates as one gesture
        // rather than as a queue of independent elements.
        el.addEventListener(
          'transitionend',
          () => { el.style.removeProperty('will-change'); },
          { once: true },
        );
      }
    },
    // Fires slightly before the element reaches the fold so motion has resolved
    // by the time the reader's eye arrives.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  );

  targets.forEach((el) => io.observe(el));

  /**
   * Safety net.
   *
   * The observer is the mechanism; this is the guarantee. If a target is ever
   * missed — a fast scroll, a resize during load, a browser quirk — content
   * would otherwise stay at opacity 0 permanently, which is worse than having
   * no animation at all. A cheap sweep on scroll reveals anything whose top has
   * already passed the fold, and stops running once nothing is left hidden.
   */
  let pending = targets.slice();
  let queued = false;
  const sweep = () => {
    queued = false;
    pending = pending.filter((el) => {
      if (el.getAttribute(REVEAL_ATTR) === 'in') return false;
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.setAttribute(REVEAL_ATTR, 'in');
        io.unobserve(el);
        return false;
      }
      return true;
    });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Catch anything already above the fold at load.
  setTimeout(sweep, 1200);
}

/**
 * Publishes a 0→1 progress value for any element carrying `data-progress`,
 * as a CSS custom property on that element. Scroll-linked sequences read
 * `--p` and need no JavaScript of their own.
 */
function initProgress() {
  const tracks = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
  if (!tracks.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    tracks.forEach((el) => el.style.setProperty('--p', '1'));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of tracks) {
      const rect = el.getBoundingClientRect();
      // Progress runs from the element's top reaching the bottom of the viewport
      // to its bottom reaching the top.
      const total = rect.height + vh;
      const travelled = vh - rect.top;
      const p = Math.min(1, Math.max(0, travelled / total));
      el.style.setProperty('--p', p.toFixed(4));
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/** Accessible disclosure panels — layer three of the progressive-disclosure model. */
function initDisclosures() {
  const discs = Array.from(document.querySelectorAll<HTMLElement>('.disc'));
  for (const disc of discs) {
    const btn = disc.querySelector<HTMLButtonElement>('.disc__btn');
    const panel = disc.querySelector<HTMLElement>('.disc__panel');
    if (!btn || !panel) continue;

    const setOpen = (open: boolean) => {
      disc.dataset.open = String(open);
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      // Collapsed content must leave the tab order, not merely be invisible.
      panel.querySelectorAll<HTMLElement>('a, button, input, textarea, select, [tabindex]')
        .forEach((el) => { el.tabIndex = open ? 0 : -1; });
    };

    setOpen(disc.dataset.open === 'true');
    btn.addEventListener('click', () => setOpen(disc.dataset.open !== 'true'));
  }
}


/**
 * Discrete steppers.
 *
 * A container marked `data-stepper` holds a set of `data-station-step` blocks.
 * Whichever block is closest to the reading line sets `data-step` on the
 * container, and everything else — which station the drawing has travelled to,
 * which step is lit, which station-local animation runs — is CSS reacting to
 * that one attribute.
 *
 * Steps rather than a continuous scrub: a mechanism indexes, it does not drift.
 */
function initSteppers() {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-stepper]'));
  if (!containers.length) return;

  for (const container of containers) {
    const steps = Array.from(container.querySelectorAll<HTMLElement>('[data-station-step]'));
    if (!steps.length) continue;

    const setStep = (i: number) => {
      if (container.dataset.step === String(i)) return;
      container.dataset.step = String(i);
      container.style.setProperty('--station', String(i));
    };

    if (!('IntersectionObserver' in window)) {
      setStep(steps.length - 1);
      continue;
    }

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible step rather than the first to cross the line, so
        // a fast scroll lands on what the reader is actually looking at.
        let best: { i: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.stationStep);
          if (!best || entry.intersectionRatio > best.ratio) best = { i, ratio: entry.intersectionRatio };
        }
        if (best) setStep(best.i);
      },
      {
        // The reading line sits a third of the way down the viewport.
        rootMargin: '-30% 0px -45% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    steps.forEach((el) => io.observe(el));
    setStep(0);
  }
}


/**
 * Tab groups used by several industry chapters to switch a diagram's subject
 * (a neck standard, a material family, a component) without leaving the page.
 */
function initTabs() {
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-tabs]'));
  for (const group of groups) {
    const tabs = Array.from(group.querySelectorAll<HTMLElement>('[data-tab]'));
    if (!tabs.length) continue;

    const select = (value: string) => {
      group.dataset.active = value;
      tabs.forEach((t) => {
        const on = t.dataset.tab === value;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      group.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
        const on = p.dataset.panel === value;
        p.hidden = !on;
      });
    };

    tabs.forEach((t) => {
      t.addEventListener('click', () => select(t.dataset.tab!));
      t.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const i = tabs.indexOf(t);
        // Arrow direction follows the document, so RTL pages step the way they read.
        const rtl = document.documentElement.dir === 'rtl';
        const fwd = e.key === 'ArrowDown' || (e.key === 'ArrowRight') !== rtl;
        let next = i;
        if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else next = (i + (fwd ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus();
        select(tabs[next].dataset.tab!);
      });
    });

    select(tabs[0].dataset.tab!);
  }
}

/**
 * Wide tables and diagram rails scroll horizontally inside their own container.
 * A container that scrolls but cannot be focused is unreachable by keyboard, so
 * each one is given a tab stop and an accessible name taken from the nearest
 * heading. Done at runtime because it applies to every chapter equally and
 * should not have to be remembered thirteen times.
 */
function initScrollRegions() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('*'))
    .filter((el) => {
      if (el.hasAttribute('tabindex')) return false;
      const overflow = getComputedStyle(el).overflowX;
      if (overflow !== 'auto' && overflow !== 'scroll') return false;
      return el.scrollWidth > el.clientWidth + 4;
    });

  for (const el of candidates) {
    el.tabIndex = 0;
    el.setAttribute('role', 'region');
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      const heading = el.closest('section')?.querySelector('h2, h3');
      const caption = el.querySelector('caption, .t-label');
      const name = heading?.textContent?.trim() || caption?.textContent?.trim();
      if (name) el.setAttribute('aria-label', name.slice(0, 120));
    }
  }
}

export function boot() {
  document.documentElement.classList.add('js');
  initReveal();
  initProgress();
  initDisclosures();
  initSteppers();
  initTabs();
  initScrollRegions();
}
