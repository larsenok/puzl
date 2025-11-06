export const COLOR_PALETTES = [
  {
    id: 'classic',
    name: 'Classic bright',
    colors: [
      '#ef4444',
      '#f59e0b',
      '#facc15',
      '#22c55e',
      '#14b8a6',
      '#0ea5e9',
      '#6366f1',
      '#a855f7',
      '#d946ef',
      '#ec4899',
      '#f43f5e',
      '#84cc16',
      '#10b981',
      '#38bdf8'
    ]
  },
  {
    id: 'contrast',
    name: 'High contrast',
    colors: [
      '#111827',
      '#ef4444',
      '#2563eb',
      '#16a34a',
      '#d97706',
      '#7c3aed',
      '#0d9488',
      '#facc15',
      '#e11d48',
      '#0ea5e9',
      '#84cc16',
      '#f97316',
      '#22d3ee',
      '#f472b6'
    ]
  },
  {
    id: 'pastel',
    name: 'Soft pastel',
    colors: [
      '#ff9aa2',
      '#ffb7b2',
      '#ffdac1',
      '#e2f0cb',
      '#c7ceea',
      '#b5ead7',
      '#c9f2c7',
      '#a5dee5',
      '#ffcbf2',
      '#f1c0e8',
      '#cddafd',
      '#a0c4ff',
      '#9bf6ff',
      '#fdffb6'
    ]
  }
];

export const DEFAULT_COLOR_PALETTE_ID = 'contrast';

export const COLOR_PALETTE_MAP = COLOR_PALETTES.reduce((accumulator, palette) => {
  accumulator[palette.id] = palette;
  return accumulator;
}, {});

export const PALETTE_ORDER = COLOR_PALETTES.map((palette) => palette.id);

export const getPaletteById = (id) =>
  COLOR_PALETTE_MAP[id] || COLOR_PALETTE_MAP[DEFAULT_COLOR_PALETTE_ID];

export const getPaletteColorsById = (id) => getPaletteById(id).colors;

export const getPalettePreviewGradient = (palette) => {
  const colors = Array.isArray(palette?.colors) ? palette.colors.filter(Boolean) : [];
  if (!colors.length) {
    return '#f59e0b';
  }
  if (colors.length === 1) {
    return colors[0];
  }
  const previewColors = colors.slice(0, 3);
  const step = previewColors.length > 1 ? 100 / (previewColors.length - 1) : 100;
  const stops = previewColors.map((color, index) => `${color} ${Math.round(index * step)}%`);
  return `linear-gradient(135deg, ${stops.join(', ')})`;
};
