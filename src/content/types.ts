/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTENT CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * Content lives as JSON, one folder per locale, mirroring the same key paths.
 * English is the master: it is authored first, then localised. Because every
 * locale file has an identical shape, a translator only ever replaces leaf
 * strings — the structure, and therefore the layout, cannot drift between
 * languages.
 *
 * A missing key falls back to English at build time and prints a warning, so a
 * page never renders an empty slot while a translation is outstanding.
 */

/* ── Shared primitives ─────────────────────────────────────────────────────── */

export interface PageMeta {
  /** <title>. Unique per page per language. */
  title: string;
  /** <meta name="description">. 140-165 characters is the working target. */
  description: string;
  /** Optional Open Graph override; falls back to title/description. */
  ogTitle?: string;
  ogDescription?: string;
}

export interface Cta {
  /** Headline above the action. Industry-specific — never a bare "Contact us". */
  headline: string;
  /** One or two lines of supporting copy. */
  body: string;
  /** The button label. */
  action: string;
  /** Secondary, lower-commitment action. */
  actionAlt?: string;
  /**
   * The message pre-filled into WhatsApp. Written in the visitor's language, in
   * the first person, and specific to the vertical — it should read like a
   * sentence the buyer would actually have typed.
   */
  prefill: string;
  /** Short reassurance under the button: response window, NDA, what to send. */
  note?: string;
}

export interface NamedItem {
  title: string;
  body: string;
}

export interface LabelledItem extends NamedItem {
  /** Drawing-sheet index, unit, or short technical marker. */
  label?: string;
}

/* ── Site-wide strings ─────────────────────────────────────────────────────── */

export interface CommonContent {
  nav: {
    industries: string;
    capabilities: string;
    about: string;
    contact: string;
    language: string;
    menu: string;
    close: string;
    home: string;
    backToIndustries: string;
    allIndustries: string;
  };
  actions: {
    whatsapp: string;
    sendProject: string;
    talkToEngineer: string;
    viewIndustry: string;
    more: string;
    less: string;
    next: string;
    previous: string;
  };
  selector: {
    /** Sits above the nine language tiles. */
    kicker: string;
    /** The one line every visitor reads before choosing a language. */
    headline: string;
    /** Small print under the grid. */
    note: string;
    continueIn: string;
  };
  trust: {
    since: string;
    projects: string;
    projectsNote: string;
    cavities: string;
    cavitiesNote: string;
    software: string;
    softwareNote: string;
    warranty: string;
    warrantyNote: string;
    delivery: string;
    deliveryNote: string;
    response: string;
    responseNote: string;
  };
  nda: {
    heading: string;
    body: string;
    points: string[];
  };
  contact: {
    heading: string;
    body: string;
    whatsappLabel: string;
    whatsappNote: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    responseLabel: string;
    /** Shown in place of a channel whose value is not yet configured. */
    pendingNote: string;
  };
  footer: {
    tagline: string;
    industriesHeading: string;
    companyHeading: string;
    contactHeading: string;
    rights: string;
    /** Mandatory transparency line about generated illustration. */
    mediaNote: string;
  };
  a11y: {
    skipToContent: string;
    languageSelector: string;
    mainNavigation: string;
    /** Applied to every generated diagram wrapper. */
    schematicLabel: string;
    scrollForMore: string;
  };
  /** Applied to any illustrative visual so it can never read as documentary proof. */
  schematic: string;
}

/* ── Homepage ──────────────────────────────────────────────────────────────── */

export interface DiagramLabels {
  /** Labels drawn inside the hero figure. Kept terse — SVG text cannot wrap. */
  hero: Record<string, string>;
  /** Labels drawn inside the five process stations. */
  process: Record<string, string>;
}

export interface PillarFigure {
  caption: string;
  /** Second caption, where a figure compares two situations side by side. */
  captionAlt?: string;
  note: string;
  rows: Array<{ label: string; value: string }>;
  chain?: string[];
  chainNote?: string;
}

export interface HomeContent {
  meta: PageMeta;
  diagram: DiagramLabels;
  hero: {
    kicker: string;
    /** The primary message. Split across lines for typographic control. */
    headline: string[];
    lead: string;
    /** The four inputs a project can start from, shown as the hero's object states. */
    inputs: string[];
    primary: string;
    secondary: string;
    /** Sits under the buttons. */
    note: string;
    /** The four verified facts on the rail under the hero. */
    facts: string[];
  };
  process: {
    kicker: string;
    heading: string;
    lead: string;
    steps: Array<{
      /** 01 / 02 / … */
      index: string;
      title: string;
      body: string;
      /** Three short technical markers rendered as data under the step. */
      markers: string[];
    }>;
    /** The line under the diagram that makes modularity explicit. */
    modular: string;
  };
  pillars: {
    kicker: string;
    heading: string;
    lead: string;
    items: Array<{
      index: string;
      title: string;
      body: string;
      /** Concrete levers, not adjectives. */
      points: string[];
      /** One line naming what this is worth to the buyer. */
      outcome: string;
      /** Labels for this pillar's diagram. */
      figure: PillarFigure;
    }>;
  };
  bento: {
    kicker: string;
    heading: string;
    lead: string;
    /** Under the grid, for the visitor who does not fit a tile. */
    fallback: string;
    fallbackAction: string;
  };
  proof: {
    kicker: string;
    heading: string;
    lead: string;
    /** Honest statement about what is and is not shown. */
    disclosure: string;
  };
  about: {
    kicker: string;
    heading: string;
    body: string[];
    /** The single positioning sentence. */
    position: string;
  };
  cta: Cta;
}

/* ── Industry pages ────────────────────────────────────────────────────────── */

/**
 * Industry content is intentionally loose below `hero`: each of the thirteen
 * pages is art-directed separately and reads its own keys out of `blocks`.
 * The envelope — meta, hero, cta — is fixed so navigation, metadata and the
 * conversion path behave identically everywhere.
 */
export interface IndustryContent {
  meta: PageMeta;
  /** Short label used on the bento tile and in navigation. */
  name: string;
  /** One line on the bento tile. Must sell the vertical, not describe it. */
  tile: string;
  /** Two or three words under the tile title, e.g. "Preforms · Closures · Tooling". */
  tileParts?: string;
  hero: {
    kicker: string;
    headline: string[];
    lead: string;
    /** Optional technical markers under the hero. */
    markers?: string[];
  };
  blocks: Record<string, unknown>;
  cta: Cta;
}

/* ── Standalone pages ──────────────────────────────────────────────────────── */

export interface CapabilitiesContent {
  meta: PageMeta;
  hero: { kicker: string; headline: string[]; lead: string };
  intro: string;
  groups: Array<{
    index: string;
    title: string;
    body: string;
    items: Array<{ name: string; note: string }>;
  }>;
  modularity: { heading: string; body: string; points: string[] };
  software: { heading: string; body: string };
  boundaries: { heading: string; body: string; points: string[] };
  cta: Cta;
}

export interface AboutContent {
  meta: PageMeta;
  hero: { kicker: string; headline: string[]; lead: string };
  sections: Array<{ index: string; title: string; body: string[] }>;
  facts: Array<{ value: string; label: string; note: string }>;
  accountability: { heading: string; body: string[] };
  cta: Cta;
}

export interface IndustriesIndexContent {
  meta: PageMeta;
  hero: { kicker: string; headline: string[]; lead: string };
  note: string;
  cta: Cta;
}

export interface ContactContent {
  meta: PageMeta;
  hero: { kicker: string; headline: string[]; lead: string };
  send: { heading: string; body: string; items: string[] };
  expect: { heading: string; steps: Array<{ index: string; title: string; body: string }> };
  cta: Cta;
}

/* ── Registry ──────────────────────────────────────────────────────────────── */

export interface LocaleContent {
  common: CommonContent;
  home: HomeContent;
  capabilities: CapabilitiesContent;
  about: AboutContent;
  contact: ContactContent;
  industriesIndex: IndustriesIndexContent;
  industries: Record<string, IndustryContent>;
}
