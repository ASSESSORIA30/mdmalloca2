/**
 * Site-wide configuration. Values marked [ ] are placeholders to replace with
 * confirmed company data before going live.
 */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  brand: "ModularDom",
  collection: "Mallorca Private Residences",
  /** Shows the "Demonstration" notice site-wide. Set NEXT_PUBLIC_DEMO_MODE=false once real assets are in. */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[private@modulardom.com]",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "[+34 000 000 000]",
    office: "[Office address, Mallorca]",
  },
  legal: {
    company: "[ModularDom legal entity name]",
    taxId: "[CIF / NIF]",
    address: "[Registered address]",
    registry: "[Mercantile registry details]",
  },
  /** Optional logo file. Leave null to use the typographic wordmark. */
  logo: null as null | { src: string; width: number; height: number },
};
