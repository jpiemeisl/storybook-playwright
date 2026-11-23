/** The themes the library ships. One source of truth for toolbars, docs and tests. */
export const themes = [
  { name: 'default', label: 'Default', description: 'Light, neutral grays with a deep teal action. The baseline every theme overrides.' },
  { name: 'harbor', label: 'Harbor', description: 'Dark ink navy with an amber action, small radii, 2px control borders and light inverse regions.' },
  { name: 'orchard', label: 'Orchard', description: 'Light and editorial: sage-tinted paper, a plum action, generous radii and serif headings.' },
] as const;

/** Name of a shipped theme (`default`, `harbor` or `orchard`), as set on `data-theme` by Theme. */
export type ThemeName = (typeof themes)[number]['name'];
