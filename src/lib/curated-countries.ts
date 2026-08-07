export const CURATED_COUNTRIES = [
  // LATAM
  "CL", "AR", "BR", "MX", "CO", "PE", "UY", "PY", "BO", "EC", "VE",
  "CR", "PA", "DO", "GT", "HN", "SV", "NI", "CU", "PR",
  // Europa
  "ES", "DE", "FR", "IT", "PT", "GB", "NL", "BE", "CH", "AT",
  "SE", "NO", "DK", "FI", "PL", "RU", "UA", "RO",
  // Norteamérica
  "US", "CA",
  // Otros relevantes
  "AU", "NZ", "JP", "IN", "ZA",
] as const;

export type CuratedCountry = typeof CURATED_COUNTRIES[number];
