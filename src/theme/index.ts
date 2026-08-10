import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1f6f5b',
    colorInfo: '#1f6f5b',
    colorSuccess: '#3d8b6e',
    colorWarning: '#c48a3a',
    colorError: '#b54a3a',
    colorBgBase: '#f3efe7',
    colorBgContainer: '#faf7f1',
    colorBgLayout: '#ebe4d8',
    colorText: '#1c2a24',
    colorTextSecondary: '#5c6b63',
    colorBorder: '#d4cbbd',
    borderRadius: 10,
    fontFamily: "'Manrope', 'Segoe UI', sans-serif",
    fontSize: 15,
    controlHeight: 40,
    controlHeightLG: 48,
  },
  components: {
    Layout: {
      headerBg: '#143d34',
      siderBg: '#163f35',
      bodyBg: '#ebe4d8',
      triggerBg: '#1f6f5b',
    },
    Menu: {
      darkItemBg: '#163f35',
      darkSubMenuItemBg: '#12342c',
      darkItemSelectedBg: '#1f6f5b',
      darkItemHoverBg: '#1a5246',
    },
    Button: {
      primaryShadow: 'none',
      fontWeight: 600,
    },
    Card: {
      headerFontSize: 16,
    },
  },
};
