// src/screens/OrdersScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { OrderCard } from '../components/OrderCard';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { CreateOrderModal } from '../components/CreateOrderModal';

const FILTER_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending', countKey: 'pendingCount' },
  { key: 'cooking', label: 'Cooking', countKey: 'cookingCount' },
  { key: 'completed', label: 'Ready', countKey: 'completedCount' },
  { key: 'delivered', label: 'Delivered', countKey: 'deliveredCount' },
];

export const OrdersScreen = () => {
  const { orders, stats, activeStatusFilter, setActiveStatusFilter, simulateIncomingOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Filter orders by active tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (activeStatusFilter !== 'all') {
        if (order.status !== activeStatusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNo = order.orderNo.toLowerCase().includes(query);
        const matchesName = (order.customerName || order.name || '').toLowerCase().includes(query);
        const matchesPhone = (order.phone || '').includes(query);
        const matchesTable = (order.table || '').toLowerCase().includes(query);
        return matchesNo || matchesName || matchesPhone || matchesTable;
      }

      return true;
    });
  }, [orders, activeStatusFilter, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Live Kitchen Orders"
        subtitle="Manage live orders received from the web menu"
      />

      {/* Top Search & Create Order Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order #, customer, phone..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Create Order Button */}
        <TouchableOpacity
          style={styles.newOrderBtn}
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={COLORS.textWhite} />
          <Text style={styles.newOrderBtnText}>New Order</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeStatusFilter === tab.key;
            const count = tab.countKey ? stats[tab.countKey] : orders.length;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveStatusFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabCountBadge,
                      isActive && styles.tabCountBadgeActive,
                      tab.key === 'pending' && count > 0 && styles.tabCountPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        isActive && styles.tabCountTextActive,
                        tab.key === 'pending' && count > 0 && styles.tabCountPendingText,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => setSelectedOrder(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="receipt-outline" size={36} color={COLORS.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {activeStatusFilter !== 'all'
                ? `No orders currently in '${activeStatusFilter}' status.`
                : 'There are no active orders matching your search.'}
            </Text>

            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => setIsCreateModalOpen(true)}
              >
                <Ionicons name="add-circle" size={16} color={COLORS.textWhite} />
                <Text style={styles.emptyCreateBtnText}>Create New Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={() => simulateIncomingOrder()}
              >
                <Ionicons name="sparkles" size={14} color={COLORS.primaryDark} />
                <Text style={styles.simulateBtnText}>Simulate Web Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* Floating Action Button (FAB) for Quick Order Entry */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateModalOpen(true)}
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={22} color={COLORS.textWhite} />
        <Text style={styles.fabText}>New Order</Text>
      </TouchableOpacity>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Create Manual In-Store / Phone Order Modal */}
      <CreateOrderModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
    ...SHADOWS.sm,
  },
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    ...SHADOWS.sm,
  },
  newOrderBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textWhite,
  },
  tabCountBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountPending: {
    backgroundColor: COLORS.accent,
  },
  tabCountPendingText: {
    color: COLORS.textWhite,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  tabCountTextActive: {
    color: COLORS.textWhite,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    ...SHADOWS.sm,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  simulateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    gap: 6,
    ...SHADOWS.lg,
    zIndex: 99,
  },
  fabText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
});
