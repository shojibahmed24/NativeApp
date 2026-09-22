import { Platform } from 'react-native';

export const TOKENS = {
  GRADIENTS: {
    PRIMARY: ['#005eb8', '#6366f1'] as [string, string],
    PRIMARY_DARK: ['#0f2f5c', '#005eb8', '#6366f1'] as [string, string, string],
    SUCCESS: ['#10b981', '#059669'] as [string, string],
    DANGER: ['#ef4444', '#dc2626'] as [string, string],
    AI: ['#8b5cf6', '#ec4899'] as [string, string],
    GOLD: ['#f59e0b', '#fbbf24'] as [string, string],
    SCREEN_BG: ['#f8fafc', '#e2e8f0'] as [string, string],
    // Theme-aware full-screen background gradients
    DARK_BG: ['#0f172a', '#1a1040', '#0f172a'] as [string, string, string],
    LIGHT_BG: ['#f8fafc', '#f1f5f9', '#e2e8f0'] as [string, string, string],
  },
  COLORS: {
    BRAND: '#005eb8',
    TEXT_PRIMARY: '#0f172a',
    TEXT_SECONDARY: '#475569',
    TEXT_MUTED: '#64748b',
    SUCCESS: '#10b981',
    DANGER: '#ef4444',
    WARNING: '#f59e0b',
  },
  SHADOWS: {
    SUBTLE: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: Platform.OS === 'web' ? 2 : 0,
    },
    ELEVATED: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: Platform.OS === 'web' ? 4 : 0,
    },
    COLORED: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: Platform.OS === 'web' ? 4 : 0,
    }),
  },
  RADIUS: {
    SM: 8,
    MD: 12,
    LG: 20,
    XL: 28,
  },
  TYPOGRAPHY: {
    TITLE: { fontSize: 28, fontWeight: '800' },
    SECTION: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    PRIMARY: { fontSize: 16, fontWeight: '600' },
    SECONDARY: { fontSize: 14, fontWeight: '400' },
    BUTTON: { fontSize: 16, fontWeight: '700' },
  }
};
