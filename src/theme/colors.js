// src/theme/colors.js
export const COLORS = {
  primary: '#D97706',         // Warm Caramel / Amber
  primaryDark: '#92400E',     // Deep Chocolate Amber
  primaryLight: '#FEF3C7',    // Warm Amber 100
  primarySoft: '#FFFBEB',     // Ivory Cream

  background: '#FAF7F2',      // Warm Off-White / Bakery Cream
  surface: '#FFFFFF',         // Crisp White for cards
  surfaceAlt: '#F5EFE6',      // Soft taupe/creamy tint
  border: '#E8DFD5',          // Subtle divider
  borderLight: '#F3ECE4',

  textPrimary: '#2B1C10',     // Espresso Dark Brown
  textSecondary: '#6B5E55',   // Warm Muted Gray
  textLight: '#9E9289',       // Placeholder / subtle
  textWhite: '#FFFFFF',

  accent: '#F59E0B',          // Honey Gold
  danger: '#DC2626',          // Red
  dangerLight: '#FEE2E2',
  success: '#10B981',        // Mint Green
  successLight: '#D1FAE5',
  info: '#3B82F6',            // Blue
  infoLight: '#DBEAFE',

  // Status mapping
  status: {
    pending: {
      bg: '#FEF3C7',
      text: '#B45309',
      border: '#FDE68A',
      label: 'Pending',
      icon: 'time-outline',
    },
    cooking: {
      bg: '#EFF6FF',
      text: '#1D4ED8',
      border: '#BFDBFE',
      label: 'Cooking',
      icon: 'flame-outline',
    },
    completed: {
      bg: '#ECFDF5',
      text: '#047857',
      border: '#A7F3D0',
      label: 'Ready',
      icon: 'checkmark-circle-outline',
    },
    delivered: {
      bg: '#F3F4F6',
      text: '#4B5563',
      border: '#E5E7EB',
      label: 'Delivered',
      icon: 'bag-check-outline',
    },
    cancelled: {
      bg: '#FEF2F2',
      text: '#B91C1C',
      border: '#FECACA',
      label: 'Cancelled',
      icon: 'close-circle-outline',
    },
  },

  veg: '#16A34A',
  nonVeg: '#DC2626',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#2B1C10',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#2B1C10',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#2B1C10',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
};
