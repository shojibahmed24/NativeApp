export const TOKENS = {
  GRADIENTS: {
    PRIMARY: ['#005eb8', '#6366f1'],
    PRIMARY_DARK: ['#0f2f5c', '#005eb8', '#6366f1'],
    SUCCESS: ['#10b981', '#059669'],
    DANGER: ['#ef4444', '#dc2626'],
    AI: ['#8b5cf6', '#ec4899'],
    GOLD: ['#f59e0b', '#fbbf24'],
    SCREEN_BG: ['#f8fafc', '#e2e8f0'],
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
      elevation: 2,
    },
    ELEVATED: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    COLORED: (color) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
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
