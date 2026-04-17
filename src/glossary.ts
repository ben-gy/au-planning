export interface GlossaryEntry {
  term: string;
  abbr?: string;
  definition: string;
}

const glossary: Record<string, GlossaryEntry> = {
  da: {
    term: 'Development Application',
    abbr: 'DA',
    definition: 'A formal application to a local council for permission to carry out building work, change the use of a property, or subdivide land. Sometimes called a "planning permit application" in Victoria.',
  },
  'planning-permit': {
    term: 'Planning Permit',
    definition: 'A legal document issued by a council that allows a specific use or development on a piece of land. Required when a proposed development doesn\'t comply with the planning scheme by right.',
  },
  vicsmart: {
    term: 'VicSmart',
    definition: 'A fast-track planning permit process in Victoria for straightforward applications (like minor building works, some subdivisions, or vegetation removal). Must be decided within 10 business days.',
  },
  s72: {
    term: 'Section 72 Amendment',
    abbr: 'S72',
    definition: 'An amendment to an existing planning permit under Section 72 of the Planning and Environment Act 1987 (Vic). Used to change conditions, extend timeframes, or modify approved plans.',
  },
  subdivision: {
    term: 'Subdivision',
    definition: 'Dividing one piece of land into two or more separate lots, each with its own title. Common in growth areas where large blocks are split into smaller residential lots.',
  },
  'change-of-use': {
    term: 'Change of Use',
    definition: 'An application to change the purpose a building or land is used for — e.g. converting a shop to a restaurant, or a house to a childcare centre. Different uses have different requirements for parking, noise, and hours of operation.',
  },
  'processing-time': {
    term: 'Processing Time',
    definition: 'The number of calendar days between when an application is lodged and when a decision is made. Victorian planning law requires standard applications to be decided within 60 statutory days, but clock stops during advertising and when further information is requested.',
  },
  lodged: {
    term: 'Lodged',
    definition: 'An application has been formally submitted to the council and assigned a reference number. The assessment clock starts ticking.',
  },
  refused: {
    term: 'Refused',
    definition: 'The council has declined to issue a permit. The applicant can appeal the decision to VCAT (Victorian Civil and Administrative Tribunal) within 60 days.',
  },
  withdrawn: {
    term: 'Withdrawn',
    definition: 'The applicant has voluntarily pulled their application before a decision was made. This often happens when the applicant is advised the application is likely to be refused and wants to revise and resubmit.',
  },
  vcat: {
    term: 'VCAT',
    abbr: 'VCAT',
    definition: 'Victorian Civil and Administrative Tribunal — the body that hears appeals on planning decisions. Applicants and objectors can both appeal council decisions to VCAT.',
  },
  'planning-scheme': {
    term: 'Planning Scheme',
    definition: 'A legal document that sets out the rules for how land can be used and developed in a municipality. Every council has its own planning scheme, which includes zones, overlays, and particular provisions.',
  },
  overlay: {
    term: 'Overlay',
    definition: 'An additional layer of planning controls on top of the base zone. Examples include heritage overlays (protecting historic buildings), flood overlays (restricting building in flood-prone areas), and bushfire overlays.',
  },
  objection: {
    term: 'Objection',
    definition: 'A formal written submission opposing a planning application. Objectors must explain what aspects of the proposal they believe are problematic and reference relevant planning policies.',
  },
  advertising: {
    term: 'Advertising / Public Notice',
    definition: 'The period during which nearby residents and the public are notified about a planning application and can submit objections. Notice is given by mail to neighbours and/or a sign on the property.',
  },
  ancillary: {
    term: 'Ancillary Structure',
    definition: 'A secondary structure on a property that supports the main building — such as a shed, carport, pergola, swimming pool, or fence. Often needs a permit if it exceeds certain size thresholds.',
  },
};

export function lookupTerm(key: string): GlossaryEntry | undefined {
  return glossary[key];
}

export function getAllTerms(): GlossaryEntry[] {
  return Object.values(glossary).sort((a, b) => a.term.localeCompare(b.term));
}

export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase();
  return Object.values(glossary).filter(
    e =>
      e.term.toLowerCase().includes(q) ||
      (e.abbr && e.abbr.toLowerCase().includes(q)) ||
      e.definition.toLowerCase().includes(q)
  );
}
