// src/components/Header.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { PhoneNotch } from './PhoneNotch';

export const Header = () => {
  const {
    company,
    isShopOpen,
    setIsShopOpen,
    simulateIncomingOrder,
    webLayoutMode,
    setWebLayoutMode,
    resetAllData,
  } = useApp();

  const handleResetData = () => {
    const doReset = () => {
      resetAllData();
      if (Platform.OS === 'web') {
        window.alert('Demo data has been restored to default.');
      } else {
        Alert.alert('Restored', 'Demo data has been restored to default.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset all orders, menu items, and categories to initial demo state?')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Reset Demo Data',
        'Reset all orders, menu items, and categories to initial demo state?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  const toggleLayoutMode = () => {
    setWebLayoutMode((curr) => (curr === 'mobile' ? 'wide' : 'mobile'));
  };

  return (
    <View style={styles.headerWrapper}>
      {/* Phone Notch & Status Bar */}
      <PhoneNotch />

      <View style={styles.container}>
        {/* Main Brand & Actions Row */}
        <View style={styles.topRow}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="gift" size={20} color={COLORS.surface} />
            </View>
            <View>
              <Text style={styles.brandName}>
                {company ? company.name : 'Lavino Cake Studio'}
              </Text>
              <Text style={styles.brandTagline}>
                {company && company.location
                  ? `${company.location} • Cake Kitchen`
                  : 'Cherupuzha • Cake Kitchen'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {/* Simulate Order Button for Quick Test */}
            <TouchableOpacity
              style={styles.testOrderButton}
              onPress={() => simulateIncomingOrder()}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={13} color={COLORS.primaryDark} />
              <Text style={styles.testOrderText}>+ Test Order</Text>
            </TouchableOpacity>

            {/* Shop Open / Closed Toggle */}
            <View style={styles.statusToggleContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isShopOpen ? COLORS.success : COLORS.danger },
                ]}
              />
              <Text style={styles.statusLabel}>{isShopOpen ? 'Open' : 'Paused'}</Text>
              <Switch
                value={isShopOpen}
                onValueChange={setIsShopOpen}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={isShopOpen ? COLORS.primary : '#ccc'}
                style={
                  Platform.OS === 'web'
                    ? { transform: [{ scale: 0.75 }] }
                    : { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }
                }
              />
            </View>
          </View>
        </View>

        {/* Web Helper Sub-Bar: Standalone indicator, Reset button & Layout switch */}
        {Platform.OS === 'web' && (
          <View style={styles.subBar}>
            <View style={styles.standaloneBadge}>
              <View style={styles.standaloneDot} />
              <Text style={styles.standaloneText}>Standalone Frontend</Text>
            </View>

            <View style={styles.subBarRight}>
              {/* Reset to Demo Data button */}
              <TouchableOpacity
                style={styles.subBarButton}
                onPress={handleResetData}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={12} color={COLORS.textSecondary} />
                <Text style={styles.subBarButtonText}>Reset Demo</Text>
              </TouchableOpacity>

              {/* Toggle Wide / Mobile Frame on Web */}
              <TouchableOpacity
                style={styles.subBarButton}
                onPress={toggleLayoutMode}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={webLayoutMode === 'mobile' ? 'expand-outline' : 'phone-portrait-outline'}
                  size={12}
                  color={COLORS.primaryDark}
                />
                <Text style={[styles.subBarButtonText, { color: COLORS.primaryDark, fontWeight: '700' }]}>
                  {webLayoutMode === 'mobile' ? 'Wide' : 'Mobile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...SHADOWS.sm,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 3,
  },
  testOrderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 1,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  standaloneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  standaloneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.success,
  },
  standaloneText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.2,
  },
  subBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  subBarButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
