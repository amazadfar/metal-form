/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLAIM REGISTER — internal, never rendered
 * ─────────────────────────────────────────────────────────────────────────────
 * Every factual assertion the site is allowed to make about Metal Form is
 * listed here with its status and its approved wording. A claim that is not
 * `confirmed` must not appear in customer-facing copy in any language.
 *
 * Rule that governs the whole project:
 *   Public research establishes facts about AN INDUSTRY.
 *   It never establishes a fact about METAL FORM.
 */

export type ClaimStatus =
  /** Stated as fact in the master brief. Safe to publish. */
  | 'confirmed'
  /** True of the industry, not of Metal Form. Usable as context, never as a capability. */
  | 'industry-context'
  /** Plausible but unverified. Do not publish in any form. */
  | 'needs-verification'
  /** Actively prohibited. Publishing this would be an overclaim. */
  | 'prohibited';

export interface Claim {
  id: string;
  claim: string;
  status: ClaimStatus;
  /** The exact permitted framing. `null` when the claim must not be published at all. */
  safeWording: string | null;
  source: 'master-brief' | 'public-research' | 'inference' | 'none';
  notes?: string;
}

export const CLAIMS: Claim[] = [
  /* ── Confirmed ─────────────────────────────────────────────────────────── */
  { id: 'since-2006', claim: 'Operating since 2006', status: 'confirmed', safeWording: 'Manufacturing since 2006', source: 'master-brief' },
  { id: 'projects-1000', claim: 'More than 1,000 successful projects since 2006', status: 'confirmed', safeWording: '1,000+ completed projects', source: 'master-brief', notes: 'Always render as a minimum ("1,000+"), never as an exact count.' },
  { id: 'cavities-46', claim: 'Tooling experience up to 46 cavities', status: 'confirmed', safeWording: 'Tooling experience up to 46 cavities', source: 'master-brief', notes: 'No customer, no application, no volume, no date may be attached. Never phrased as "we routinely build 46-cavity tools".' },
  { id: 'catia', claim: 'CATIA is in use', status: 'confirmed', safeWording: 'CATIA', source: 'master-brief' },
  { id: 'solidworks', claim: 'SolidWorks is in use', status: 'confirmed', safeWording: 'SolidWorks', source: 'master-brief' },
  { id: 'mould-warranty', claim: 'Mould warranty is offered', status: 'confirmed', safeWording: 'Tooling warranty terms are defined per project and mould specification', source: 'master-brief', notes: 'No shot counts, no year figures, no spare-part terms, no exclusions.' },
  { id: 'international-delivery', claim: 'International delivery is available', status: 'confirmed', safeWording: 'International delivery', source: 'master-brief', notes: 'No Incoterm, no lead time, no customs promise.' },
  { id: 'response-48h', claim: 'Initial response within 48 business hours', status: 'confirmed', safeWording: 'Initial response within 48 business hours', source: 'master-brief', notes: 'Explicitly an initial technical response — never a final quotation or completed engineering.' },
  { id: 'nda', claim: 'NDA / confidentiality available before detailed disclosure', status: 'confirmed', safeWording: 'An NDA can be signed before detailed technical disclosure', source: 'master-brief', notes: 'Must never be used as an excuse for an absent project history.' },
  { id: 'reverse-engineering', claim: 'Reverse engineering from a physical sample', status: 'confirmed', safeWording: 'Reverse engineering from a sample, a photograph or an incomplete input', source: 'master-brief' },
  { id: 'processes', claim: 'Injection, PET, blow and die-cast tooling; multi-cavity; hot and cold runner; inserts; technical mechanisms; CNC milling, turning and manual machining', status: 'confirmed', safeWording: 'Named individually as capabilities', source: 'master-brief' },

  /* ── Industry context only ─────────────────────────────────────────────── */
  { id: 'sector-economics', claim: 'Sector cost drivers, defect modes, cavitation norms, neck-finish standards, material behaviour', status: 'industry-context', safeWording: 'Describe as how the industry works — never as a measured Metal Form result', source: 'public-research' },
  { id: 'tethered-caps', claim: 'EU tethered-cap requirement affects closure tooling', status: 'industry-context', safeWording: 'Referenced as a market requirement driving closure re-tooling', source: 'public-research' },

  /* ── Needs verification — withheld ─────────────────────────────────────── */
  { id: 'machine-list', claim: 'Specific machines, tonnages, counts', status: 'needs-verification', safeWording: null, source: 'none' },
  { id: 'floor-area', claim: 'Factory floor area', status: 'needs-verification', safeWording: null, source: 'none' },
  { id: 'headcount', claim: 'Number of employees', status: 'needs-verification', safeWording: null, source: 'none' },
  { id: 'export-countries', claim: 'Number of countries served', status: 'needs-verification', safeWording: null, source: 'none' },
  { id: 'named-clients', claim: 'Any customer name, logo or identifiable project', status: 'needs-verification', safeWording: null, source: 'none', notes: 'Historical heavy-vehicle and marine work exists but no brand may be named without written permission.' },
  { id: 'tolerances', claim: 'Specific micron tolerances held over specific shot counts', status: 'needs-verification', safeWording: null, source: 'none' },
  { id: 'savings-pct', claim: 'A percentage cost or cycle-time saving', status: 'needs-verification', safeWording: null, source: 'none', notes: 'Only ever expressible after a project-specific analysis. Never a marketing number.' },

  /* ── Prohibited ────────────────────────────────────────────────────────── */
  { id: 'iso-13485', claim: 'ISO 13485', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'iso-9001', claim: 'ISO 9001', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'iatf', claim: 'IATF 16949', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'gmp', claim: 'GMP manufacturing', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'fda', claim: 'FDA registration or approval', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'cleanroom', claim: 'Owned cleanroom production', status: 'prohibited', safeWording: null, source: 'none', notes: 'Also prohibited VISUALLY — no cleanroom imagery, no sterile-suit figures, no controlled-environment photography.' },
  { id: 'sterile', claim: 'Sterile or validated manufacturing, validated sterilisation', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'medical-traceability', claim: 'Full regulated medical traceability / medical-device QMS', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'cmm-dept', claim: 'A formal CMM or QC department', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'two-shot', claim: 'Two-shot / multi-material moulding', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'grinding', claim: 'Grinding capability', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'moldflow', claim: 'Moldflow or comparable simulation software', status: 'prohibited', safeWording: null, source: 'none', notes: 'Flow, cooling and warpage may be discussed as engineering topics; named simulation software may not be claimed.' },
  { id: '3d-scanning', claim: 'Advanced 3D scanning equipment', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'owned-fleet', claim: 'An owned injection-moulding machine fleet', status: 'prohibited', safeWording: null, source: 'none', notes: 'Public proposition is SINGLE ACCOUNTABILITY, not SINGLE BUILDING. Never claim ownership of every facility — and never describe the company as a broker either.' },
  { id: 'cheapest', claim: 'Cheaper than China by X%', status: 'prohibited', safeWording: null, source: 'none', notes: 'Price competitiveness may be implied through engineering, never through a race to the bottom.' },
  { id: 'fixed-pricing', claim: 'Published or "starting from" pricing', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'reserved-capacity', claim: 'Guaranteed reserved production capacity', status: 'prohibited', safeWording: null, source: 'none', notes: 'Only true where a contract actually reserves it. Second-source language must stay at READINESS, not guarantee.' },
  { id: 'emergency-swap', claim: 'If your machine breaks tomorrow we can produce your part immediately', status: 'prohibited', safeWording: null, source: 'none', notes: 'Physically implausible when the customer tool sits in another country. Use second-source readiness instead.' },
  { id: 'electrical-cert', claim: 'UL / electrical safety certification', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'pressure-rating', claim: 'Pressure ratings or potable-water approvals for fittings', status: 'prohibited', safeWording: null, source: 'none' },
  { id: 'chemical-resistance', claim: 'Validated chemical resistance', status: 'prohibited', safeWording: null, source: 'none', notes: 'Material selection may be discussed; validated resistance may not be promised.' },
];

/** Dev-time guard used by the content lint script. */
export const FORBIDDEN_PHRASES: RegExp[] = [
  /\bISO\s?13485\b/i,
  /\bISO\s?9001\b/i,
  /\bIATF\b/i,
  /\bGMP\b/i,
  /\bFDA[- ]approved\b/i,
  /\bFDA[- ]registered\b/i,
  /\bcleanroom\b/i,
  /\bclean room\b/i,
  /\bsteril(e|ised|ized|isation|ization)\b/i,
  /\bMoldflow\b/i,
  /\btwo[- ]shot\b/i,
  /\bworld[- ]class\b/i,
  /\bcutting[- ]edge\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\bseamless(ly)?\b/i,
  /\bleverag(e|ing)\b/i,
  /\bempower(ing|s)?\b/i,
  /\bsynerg/i,
  /\bone[- ]stop[- ]shop\b/i,
  /\bMetal\s*Foam\b/i,
  /\bstarting (from|at) \$/i,
];
