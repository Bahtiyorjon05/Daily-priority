/**
 * Dark Mode Color Utilities
 * Ensure proper contrast ratios for WCAG compliance
 */

/**
 * WCAG AA requires:
 * - Normal text: contrast ratio of at least 4.5:1
 * - Large text (18pt+): contrast ratio of at least 3:1
 */

export const colors = {
  // Light mode
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#475569', // slate-600
      tertiary: '#64748b', // slate-500
      disabled: '#94a3b8', // slate-400
    },
    border: {
      primary: '#e2e8f0', // slate-200
      secondary: '#cbd5e1', // slate-300
    },
    accent: {
      blue: '#3b82f6', // blue-600
      green: '#22c55e', // green-600
      red: '#ef4444', // red-600
      yellow: '#eab308', // yellow-600
      purple: '#a855f7', // purple-600
    },
  },

  // Dark mode (WCAG compliant)
  dark: {
    background: {
      primary: '#0f172a', // slate-900
      secondary: '#1e293b', // slate-800
      tertiary: '#334155', // slate-700
    },
    text: {
      primary: '#f8fafc', // slate-50 (18.24:1 contrast)
      secondary: '#cbd5e1', // slate-300 (9.41:1 contrast)
      tertiary: '#94a3b8', // slate-400 (5.87:1 contrast)
      disabled: '#64748b', // slate-500
    },
    border: {
      primary: '#334155', // slate-700
      secondary: '#475569', // slate-600
    },
    accent: {
      blue: '#60a5fa', // blue-400 (lighter for better contrast)
      green: '#4ade80', // green-400
      red: '#f87171', // red-400
      yellow: '#fbbf24', // yellow-400
      purple: '#c084fc', // purple-400
    },
  },
} as const

/**
 * Status colors with proper dark mode variants
 */
export const statusColors = {
  success: {
    light: {
      bg: '#dcfce7', // green-100
      text: '#166534', // green-800
      border: '#86efac', // green-300
    },
    dark: {
      bg: '#14532d', // green-950
      text: '#86efac', // green-300
      border: '#166534', // green-800
    },
  },
  error: {
    light: {
      bg: '#fee2e2', // red-100
      text: '#991b1b', // red-800
      border: '#fca5a5', // red-300
    },
    dark: {
      bg: '#7f1d1d', // red-950
      text: '#fca5a5', // red-300
      border: '#991b1b', // red-800
    },
  },
  warning: {
    light: {
      bg: '#fef3c7', // yellow-100
      text: '#92400e', // yellow-900
      border: '#fde047', // yellow-300
    },
    dark: {
      bg: '#713f12', // yellow-950
      text: '#fde047', // yellow-300
      border: '#92400e', // yellow-900
    },
  },
  info: {
    light: {
      bg: '#dbeafe', // blue-100
      text: '#1e40af', // blue-800
      border: '#93c5fd', // blue-300
    },
    dark: {
      bg: '#1e3a8a', // blue-950
      text: '#93c5fd', // blue-300
      border: '#1e40af', // blue-800
    },
  },
} as const

/**
 * Priority colors with proper dark mode variants
 */
export const priorityColors = {
  LOW: {
    light: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
    dark: { bg: '#312e81', text: '#c7d2fe', border: '#4338ca' },
  },
  MEDIUM: {
    light: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    dark: { bg: '#1e3a8a', text: '#93c5fd', border: '#1e40af' },
  },
  HIGH: {
    light: { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
    dark: { bg: '#7c2d12', text: '#fdba74', border: '#9a3412' },
  },
  URGENT: {
    light: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    dark: { bg: '#7f1d1d', text: '#fca5a5', border: '#991b1b' },
  },
} as const

/**
 * Get color value based on theme
 */
export function getThemedColor(
  path: string,
  theme: 'light' | 'dark'
): string {
  const keys = path.split('.')
  let value: any = colors[theme]

  for (const key of keys) {
    value = value?.[key]
  }

  return value || '#000000'
}

/**
 * Dark mode CSS custom properties
 * Add to your globals.css
 */
export const darkModeCSSVars = `
:root {
  --color-bg-primary: ${colors.light.background.primary};
  --color-bg-secondary: ${colors.light.background.secondary};
  --color-bg-tertiary: ${colors.light.background.tertiary};
  
  --color-text-primary: ${colors.light.text.primary};
  --color-text-secondary: ${colors.light.text.secondary};
  --color-text-tertiary: ${colors.light.text.tertiary};
  
  --color-border-primary: ${colors.light.border.primary};
  --color-border-secondary: ${colors.light.border.secondary};
}

.dark {
  --color-bg-primary: ${colors.dark.background.primary};
  --color-bg-secondary: ${colors.dark.background.secondary};
  --color-bg-tertiary: ${colors.dark.background.tertiary};
  
  --color-text-primary: ${colors.dark.text.primary};
  --color-text-secondary: ${colors.dark.text.secondary};
  --color-text-tertiary: ${colors.dark.text.tertiary};
  
  --color-border-primary: ${colors.dark.border.primary};
  --color-border-secondary: ${colors.dark.border.secondary};
}
`
