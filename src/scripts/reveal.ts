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
 * Whichever block the reader is actually on sets `data-step` on the container,
 * and everything else — which station the drawing has travelled to, which step
 * is lit, which station-local animation runs — is CSS reacting to that one
 * attribute.
 *
 * ── Why this is not an IntersectionObserver ─────────────────────────────────
 * It used to be, with a thin band across the middle of the viewport, and it
 * flapped. Two reasons, both inherent to the approach:
 *
 *   · An observer callback only carries the steps whose intersection *changed*.
 *     Picking "the most visible" out of that partial batch means the answer
 *     depends on which entries happened to fire together.
 *
 *   · A band has an edge. Sitting on that edge, one or two pixels of scroll
 *     flips the winner, and flipping it back flips the state back. Scrolling
 *     gently near a boundary strobed the drawing between two stations.
 *
 * What replaces it holds a step until the reader has genuinely moved on:
 *
 *   · A tall reading window rather than a line, so adjacent steps overlap
 *     inside it and there is no single crossing point.
 *   · Hysteresis: a challenger has to beat the step currently showing by a
 *     clear margin, not by a pixel. Scrolling back a little does not undo it.
 *   · A short dwell, so a fast flick through four stages lands on one of them
 *     instead of strobing through all four.
 *
 * The step still changes discretely — a mechanism indexes, it does not drift —
 * but the threshold it changes at now has depth to it.
 */
function initSteppers() {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-stepper]'));
  if (!containers.length) return;

  interface Group {
    container: HTMLElement;
    steps: HTMLElement[];
    current: number;
    changedAt: number;
  }

  const groups: Group[] = containers
    .map((container) => ({
      container,
      steps: Array.from(container.querySelectorAll<HTMLElement>('[data-station-step]')),
      current: -1,
      changedAt: 0,
    }))
    .filter((g) => g.steps.length > 0);

  if (!groups.length) return;

  const setStep = (g: Group, i: number, now: number) => {
    if (g.current === i) return;
    g.current = i;
    g.changedAt = now;
    g.container.dataset.step = String(i);
    g.container.style.setProperty('--station', String(i));
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    // No scroll-linked state at all: the first station is shown and stays.
    groups.forEach((g) => setStep(g, 0, 0));
    return;
  }

  /** A challenger must be this much more present than the incumbent to win. */
  const HYSTERESIS = 1.35;
  /** And the incumbent gets at least this long before it can be replaced. */
  const DWELL_MS = 260;
  /** The reading window, as a fraction of the viewport. Deliberately tall. */
  const WINDOW_TOP = 0.16;
  const WINDOW_BOTTOM = 0.8;

  const overlap = (rect: DOMRect, top: number, bottom: number) =>
    Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));

  let ticking = false;
  const update = () => {
    ticking = false;
    const now = performance.now();
    const vh = window.innerHeight;
    const top = vh * WINDOW_TOP;
    const bottom = vh * WINDOW_BOTTOM;

    for (const g of groups) {
      // A container that is nowhere near the viewport keeps whatever it last
      // showed, so scrolling past a chapter and back does not reset it.
      const box = g.container.getBoundingClientRect();
      if (box.bottom < -vh || box.top > vh * 2) continue;

      let bestIndex = -1;
      let bestScore = 0;
      let currentScore = 0;

      for (let i = 0; i < g.steps.length; i++) {
        const score = overlap(g.steps[i].getBoundingClientRect(), top, bottom);
        if (i === g.current) currentScore = score;
        if (score > bestScore) { bestScore = score; bestIndex = i; }
      }

      if (bestIndex < 0) continue;
      if (g.current < 0) { setStep(g, bestIndex, now); continue; }
      if (bestIndex === g.current) continue;

      // The step showing has left the window entirely — hand over at once, or
      // the drawing would sit on a stage the reader has scrolled past.
      if (currentScore === 0) { setStep(g, bestIndex, now); continue; }

      if (now - g.changedAt < DWELL_MS) continue;
      if (bestScore > currentScore * HYSTERESIS) setStep(g, bestIndex, now);
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  groups.forEach((g) => setStep(g, 0, 0));
  update();
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
