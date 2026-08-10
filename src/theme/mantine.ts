import { createTheme } from '@mantine/core';

export const mantineTheme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'Manrope, Segoe UI, sans-serif',
  headings: {
    fontFamily: 'Fraunces, Georgia, serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  colors: {
    teal: [
      '#e8f5f1',
      '#c5e4db',
      '#9dd0c2',
      '#72bba7',
      '#4fa78f',
      '#1f6f5b',
      '#185a4a',
      '#143d34',
      '#0f2f28',
      '#0a1f1a',
    ],
  },
  primaryShade: 5,
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Modal: {
      defaultProps: {
        centered: true,
        radius: 'lg',
        overlayProps: { backgroundOpacity: 0.45, blur: 4 },
      },
    },
    Paper: {
      defaultProps: { radius: 'lg' },
    },
  },
});
