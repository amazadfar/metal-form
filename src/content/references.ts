/**
 * Public source register for standards and regulatory context that remains
 * visible after the final content-governance pass. These links describe the
 * external requirement. They are not Metal Form certifications.
 */
export const REFERENCES = {
  'REF-EU-2019-904-A6': {
    title: 'Directive (EU) 2019/904, Article 6 — Product requirements',
    publisher: 'EUR-Lex / European Union',
    url: 'https://eur-lex.europa.eu/eli/dir/2019/904',
    supports: ['Attached-cap requirement for certain single-use plastic beverage containers in the EU market'],
    checkedOn: '2026-08-26',
    note: 'External EU market requirement; not a Metal Form certification.',
  },
  'REF-ISO-9261': {
    title: 'ISO 9261:2004 — Agricultural irrigation equipment — Emitters and emitting pipe — Specification and test methods',
    publisher: 'ISO',
    url: 'https://www.iso.org/standard/28459.html',
    supports: ['Standard scope, requirements, conformity methods and published outlet-flow scope'],
    checkedOn: '2026-08-26',
    note: 'ISO states that this edition was last reviewed and confirmed in 2025.',
  },
  'REF-ISO-8317': {
    title: 'ISO 8317:2015 — Child-resistant packaging — Requirements and testing procedures for reclosable packages',
    publisher: 'ISO',
    url: 'https://www.iso.org/standard/61650.html',
    supports: ['Performance requirements and test methods for reclosable child-resistant packages'],
    checkedOn: '2026-08-26',
    note: 'External package requirement; not a tooling certification.',
  },
  'REF-US-16CFR-1700': {
    title: '16 CFR Part 1700 — Poison Prevention Packaging',
    publisher: 'U.S. eCFR / U.S. Government',
    url: 'https://www.ecfr.gov/current/title-16/chapter-II/subchapter-E/part-1700',
    supports: ['U.S. special-packaging requirements and test framework'],
    checkedOn: '2026-08-26',
    note: 'Current official eCFR Part 1700 URL verified during implementation.',
  },
  'REF-CPSC-F963': {
    title: 'Toy Safety Business Guidance',
    publisher: 'U.S. Consumer Product Safety Commission',
    url: 'https://www.cpsc.gov/Business--Manufacturing/Business-Education/Toy-Safety',
    supports: ['Current U.S. CPSC business guidance for ASTM F963 toy-safety requirements'],
    checkedOn: '2026-08-26',
    note: 'External product requirement; not a Metal Form approval.',
  },
} as const;

export type ReferenceId = keyof typeof REFERENCES;
