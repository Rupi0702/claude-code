/**
 * Dark-first "nightlife" palette. Neon accents are used sparingly (progress,
 * active state, special events) so the base UI stays legible at arm's length.
 */
export const colors = {
  bgBase: '#0B0620',
  bgElevated: '#150C33',
  bgCard: '#1D1140',
  bgCardAlt: '#241751',
  border: '#3A2B6E',

  textPrimary: '#F7F4FF',
  textSecondary: '#B7ADD9',
  textMuted: '#7A6FA3',

  neonPink: '#FF3FA4',
  neonPurple: '#8B5CF6',
  neonBlue: '#3FD8FF',
  neonYellow: '#FFD23F',
  neonGreen: '#3FFFB0',
  neonRed: '#FF5C5C',

  gradientPrimary: ['#FF3FA4', '#8B5CF6'] as const,
  gradientSecondary: ['#3FD8FF', '#8B5CF6'] as const,
  gradientChaos: ['#FF5C5C', '#FFD23F', '#8B5CF6'] as const,
  gradientCard: ['#241751', '#150C33'] as const,

  success: '#3FFFB0',
  warning: '#FFD23F',
  danger: '#FF5C5C',

  overlayScrim: 'rgba(6, 3, 20, 0.82)',
};

export const modeColors: Record<string, string> = {
  classic: colors.neonPurple,
  icebreaker: colors.neonBlue,
  bestfriends: colors.neonGreen,
  couples: colors.neonPink,
  wild: colors.neonRed,
  chaos: colors.neonYellow,
};

export const intensityColors: Record<number, string> = {
  1: colors.neonBlue,
  2: colors.neonGreen,
  3: colors.neonYellow,
  4: colors.neonRed,
  5: colors.neonPink,
};
