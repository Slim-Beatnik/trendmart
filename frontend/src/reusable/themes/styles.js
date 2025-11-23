// COLOR PALETTE - from logo
// DARK_BLUE: #0a1f44
// emphasis: #135c8b
// SPLASH: #00aef0
// HIGHLIGHT: #9fcecb
// EGGSHELL_: #f3f3ea

export const colorPalette = {
  variant: {
    error: '#ccadab',
    info: '#b4c7e4',
    success: '#9fcecb',
  },
  light: {
    contrast: '#0a1f44',
    emphasis: '#135c8b',
    splash: '#00aef0',
    highlight: '#9fcecb',
    darkBg: '#0a1f44',
    lightBg: '#f3f3ea',
    whiteBg: '#fffffb',
    text: '#fffffb',
    details: '#e8e8e8e8',
  },
  dark: {
    contrast: '#f3f3ea',
    emphasis: '#00aef0',
    splash: '#9fcecb',
    highlight: '#f3f3ea',
    darkBg: '#135c8b',
    lightBg: '#0a1f44',
    whiteBg: '#135c8b',
    text: '#1d2235',
    details: '#9fcecbe8',
  },
};

const styleValues = {
  bR_more: '0.5rem',
  bR_less: '0.3rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
};

const baseBtn = {
  border: 'rem solid transparent',
  borderRadius: '.5rem',
  padding: '.3rem 0rem',
  cursor: 'pointer',
  fontWeight: 700,
};

const contrast = (mode) => ({
  background: colorPalette[mode].contrast,
  borderColor: colorPalette[mode].splash,
  color: colorPalette[mode].text,
});

const splash = (mode) => ({
  background: colorPalette[mode].splash,
  borderColor: colorPalette[mode].contrast,
  color: colorPalette[mode].contrast,
});

const muted = (mode) => ({
  background: colorPalette[mode].highlight,
  color: colorPalette[mode].contrast,
  borderColor: colorPalette[mode].splash,
});

const highlight = (mode) => ({
  background: colorPalette[mode].highlight,
  color: colorPalette[mode].contrast,
  borderColor: colorPalette[mode].splash,
});

const emphasis = (mode) => ({
  background: colorPalette[mode].emphasis,
  color: colorPalette[mode].text,
  borderColor: colorPalette[mode].splash,
});

const darkText = (mode) => ({
  background: colorPalette[mode].lightBg,
  color: colorPalette[mode].contrast,
  borderColor: colorPalette[mode].splash,
});

const lightText = (mode) => ({
  background: colorPalette[mode].darkBg,
  color: colorPalette[mode].text,
  borderColor: colorPalette[mode].splash,
});

export const buildTheme = (mode) => ({
  colors: colorPalette[mode],
  alerts: colorPalette.variant,
  props: styleValues,
  buttons: {
    contrast: { ...contrast(mode), ...baseBtn },
    splash: { ...splash(mode), ...baseBtn },
    muted: { ...muted(mode), ...baseBtn },
    highlight: { ...highlight(mode), ...baseBtn },
    emphasis: { ...emphasis(mode), ...baseBtn },
  },
  schemes: {
    contrast: contrast(mode),
    splash: splash(mode),
    muted: muted(mode),
    highlight: highlight(mode),
    emphasis: emphasis(mode),
    darkText: darkText(mode),
    lightText: lightText(mode),
  },
});
