// src/screens/AnalyticsScreen.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

export const AnalyticsScreen = () => {
  const { stats, orders } = useApp();

  // Hourly volume simulation for today
  const hourlyData = [
    { hour: '10 AM', orders: 2, height: 35 },
    { hour: '12 PM', orders: 5, height: 75 },
    { hour: '2 PM', orders: 4, height: 60 },
    { hour: '4 PM', orders: 7, height: 100 },
    { hour: '6 PM', orders: 6, height: 85 },
    { hour: '8 PM', orders: 3, height: 45 },
  ];

  // Best Selling Cakes leaderboard
  const topSellers = [
    {
      name: 'Belgian Truffle Chocolate Cake',
      category: 'Celebration Cakes',
      sold: 14,
      revenue: '₹10,500',
      percentage: 38,
    },
    {
      name: 'New York Blueberry Cheesecake',
      category: 'Cheesecakes',
      sold: 11,
      revenue: '₹3,080',
      percentage: 24,
    },
    {
      name: 'Red Velvet Cream Cheese Cake',
      category: 'Celebration Cakes',
      sold: 8,
      revenue: '₹4,400',
      percentage: 18,
    },
    {
      name: 'French Butter Croissant',
      category: 'Pastries',
      sold: 16,
      revenue: '₹2,240',
      percentage: 12,
    },
    {
      name: 'Salted Caramel Hazelnut Cupcake',
      category: 'Cupcakes',
      sold: 9,
      revenue: '₹1,440',
      percentage: 8,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Analytics & Sales Stats"
        subtitle="Real-time revenue, kitchen speed, and cake performance"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Revenue */}
          <View style={[styles.metricCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="cash" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.metricLabel}>Today's Revenue</Text>
            <Text style={styles.metricValue}>₹{stats.todayRevenue.toLocaleString()}</Text>
            <Text style={styles.metricTrend}>↑ +18% vs yesterday</Text>
          </View>

          {/* Total Orders */}
          <View style={[styles.metricCard, { borderLeftColor: COLORS.info, borderLeftWidth: 4 }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="receipt" size={20} color={COLORS.info} />
            </View>
            <Text style={styles.metricLabel}>Total Orders Today</Text>
            <Text style={styles.metricValue}>{stats.totalOrdersToday}</Text>
            <Text style={styles.metricSub}>Active in system</Text>
          </View>

          {/* Average Order Value */}
          <View style={[styles.metricCard, { borderLeftColor: COLORS.success, borderLeftWidth: 4 }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="pie-chart" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.metricLabel}>Avg. Order Value</Text>
            <Text style={styles.metricValue}>₹{stats.averageOrderValue}</Text>
            <Text style={styles.metricSub}>Per transaction</Text>
          </View>

          {/* Average Prep Time */}
          <View style={[styles.metricCard, { borderLeftColor: COLORS.accent, borderLeftWidth: 4 }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="timer" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.metricLabel}>Avg. Kitchen Speed</Text>
            <Text style={styles.metricValue}>{stats.avgPrepTimeMinutes} mins</Text>
            <Text style={styles.metricSub}>Order to ready</Text>
          </View>
        </View>

        {/* Hourly Peak Time Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Peak Order Hours (Today)</Text>
              <Text style={styles.sectionSubtitle}>Busiest order times for kitchen staffing</Text>
            </View>
            <View style={styles.peakPill}>
              <Ionicons name="flame" size={12} color={COLORS.primaryDark} />
              <Text style={styles.peakPillText}>Peak: 4 - 6 PM</Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            {hourlyData.map((item, idx) => (
              <View key={idx} style={styles.barColumn}>
                <Text style={styles.barValue}>{item.orders}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${item.height}%`,
                        backgroundColor: item.height >= 80 ? COLORS.primary : COLORS.primaryLight,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barHour}>{item.hour}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Status Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Fulfillment Ratio</Text>
          <Text style={styles.sectionSubtitle}>Breakdown across current workflow stages</Text>

          <View style={styles.ratioBar}>
            <View
              style={[
                styles.ratioSegment,
                { flex: Math.max(1, stats.completedCount + stats.deliveredCount), backgroundColor: COLORS.success },
              ]}
            />
            <View
              style={[
                styles.ratioSegment,
                { flex: Math.max(1, stats.cookingCount), backgroundColor: COLORS.info },
              ]}
            />
            <View
              style={[
                styles.ratioSegment,
                { flex: Math.max(1, stats.pendingCount), backgroundColor: COLORS.accent },
              ]}
            />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>
                Ready & Delivered ({stats.completedCount + stats.deliveredCount})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
              <Text style={styles.legendText}>In Kitchen ({stats.cookingCount})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Pending ({stats.pendingCount})</Text>
            </View>
          </View>
        </View>

        {/* Top 5 Best Selling Cakes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Top Selling Cakes & Bakes</Text>
          <Text style={styles.sectionSubtitle}>Highest demand items driving revenue</Text>

          <View style={styles.sellersList}>
            {topSellers.map((cake, idx) => (
              <View key={idx} style={styles.sellerRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.cakeName}>{cake.name}</Text>
                  <Text style={styles.cakeCategory}>{cake.category} • {cake.sold} orders</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${cake.percentage}%`, backgroundColor: COLORS.primary },
                      ]}
                    />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cakeRevenue}>{cake.revenue}</Text>
                  <Text style={styles.cakeShare}>{cake.percentage}% share</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricTrend: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  peakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  peakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 90,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barHour: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 12,
    gap: 2,
  },
  ratioSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sellersList: {
    marginTop: 12,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cakeName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cakeCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cakeRevenue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cakeShare: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
