'use client';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const brandColors = {
  dark: '#131921',
  darkDeep: '#0f1419',
  darkPaper: '#12181f',
  darkSecondary: '#232f3e',
  accent: '#FFB547',
  accentHover: '#e6a23e',
  indigo: '#6C63FF',
  indigoHover: '#5b54e6',
  heroBackground: '#3b3699',
  teal: '#007185',
  tealHover: '#005F6B',
  success: '#067D62',
  danger: '#cc0c39',
  cta: '#ffd814',
  ctaHover: '#f7ca00',
  border: '#e3e6e6',
  borderDark: '#1f2937',
  bgPage: '#f9fafb',
  bgCard: '#ffffff',
  textDark: '#0f1111',
  textMuted: '#565959',
  link: '#007185',
  statBlue: '#232f3e',
  statTeal: '#007185',
  statOrange: '#FFB547',
  statRed: '#cc0c39',
  shortcutGreen: '#067D62',
  shortcutDark: '#232f3e',
  shortcutTeal: '#007185',
  shortcutSlate: '#37475a',
  shortcutNavy: '#131921',
  shortcutOrange: '#FFB547',
};

const baseThemeOptions = {
  cssVariables: { colorSchemeSelector: 'data-toolpad-color-scheme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brandColors.accent, light: '#ffc76a', dark: brandColors.accentHover, contrastText: brandColors.dark },
        secondary: { main: brandColors.darkSecondary, light: brandColors.shortcutSlate, dark: brandColors.dark, contrastText: '#fff' },
        error: { main: red.A400 },
        background: { default: brandColors.bgPage, paper: brandColors.bgCard },
        text: { primary: brandColors.textDark, secondary: brandColors.textMuted },
      },
    },
    dark: {
      palette: {
        mode: 'dark' as const,
        primary: { main: brandColors.accent, light: '#ffc76a', dark: brandColors.accentHover, contrastText: brandColors.dark },
        secondary: { main: brandColors.shortcutSlate, light: '#485769', dark: brandColors.darkSecondary, contrastText: '#fff' },
        error: { main: red.A200 },
        background: { default: brandColors.dark, paper: brandColors.darkPaper },
        text: { primary: '#F9FAFB', secondary: '#9CA3AF' },
        divider: brandColors.borderDark,
      },
    },
  },
  breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
    button: { textTransform: 'none' as const, fontWeight: 500 },
    h6: { fontWeight: 600, fontSize: '1.125rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 12, textTransform: 'none' as const, boxShadow: 'none', '&:hover': { boxShadow: 'none' } } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)', border: `1px solid ${brandColors.border}` } },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiTextField: { defaultProps: { variant: 'outlined' as const, size: 'small' as const, fullWidth: true } },
    MuiFormControl: { defaultProps: { size: 'small' as const, fullWidth: true } },
  },
};

const theme = createTheme(baseThemeOptions as any);
export default theme;
