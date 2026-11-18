// src/components/OrderCard.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { StatusBadge } from './StatusBadge';
import { useApp } from '../context/AppContext';

export const OrderCard = ({ order, onPress }) => {
  const { updateOrderStatus, cancelOrder } = useApp();

  const getElapsedTime = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.orderIdent}>
          {/* Prominent Continuous Sequential Order Badge */}
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>
              Order #{order.orderNumber || order.orderNo?.replace('ORD-', '') || '101'}
            </Text>
          </View>
          <Text style={styles.orderNo}>{order.orderNo}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.tablePill}>
            <Ionicons name="calendar-outline" size={10} color={COLORS.primaryDark} />
            <Text style={styles.tablePillText}>
              {order.date ? `${order.date}${order.time ? ` • ${order.time}` : ''}` : (order.table || 'Today')}
            </Text>
          </View>
          <StatusBadge status={order.status} size="small" />
        </View>
      </View>

      {/* Customer Info & Elapsed Time */}
      <View style={styles.customerRow}>
        <Ionicons name="person-circle-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.customerName}>{order.customerName || order.name || 'Customer'}</Text>
        <Text style={styles.customerDot}>•</Text>
        <Text style={styles.customerPhone}>{order.phone}</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.timeWrapper}>
          <Ionicons name="time-outline" size={11} color={COLORS.textLight} />
          <Text style={styles.timeText}>{getElapsedTime(order.startTime)}</Text>
        </View>
      </View>

      {/* Items Preview */}
      <View style={styles.itemsContainer}>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.qty}×</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.variant ? (
                <View style={styles.variantBadge}>
                  <Text style={styles.variantBadgeText}>{item.variant}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
          </View>
        ))}
      </View>

      {/* Special Message/Note snippet if present */}
      {order.notes && (
        <View style={styles.notesBanner}>
          <Ionicons name="sparkles" size={12} color={COLORS.accent} />
          <Text style={styles.notesText} numberOfLines={1}>
            {order.notes}
          </Text>
        </View>
      )}

      {/* Card Footer: Total & Status Transition Controls */}
      <View style={styles.cardFooter}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.total}</Text>
        </View>

        <View style={styles.buttonsGroup}>
          {/* Only forward progression buttons on card. Revert is inside the detail modal */}
          {order.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.btnReject}
                onPress={(e) => {
                  e.stopPropagation();
                  cancelOrder(order._id);
                }}
              >
                <Ionicons name="close" size={14} color={COLORS.danger} />
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCooking}
                onPress={(e) => {
                  e.stopPropagation();
                  updateOrderStatus(order._id, 'cooking');
                }}
              >
                <Ionicons name="flame" size={14} color={COLORS.textWhite} />
                <Text style={styles.btnActionText}>Start Cooking</Text>
              </TouchableOpacity>
            </>
          )}

          {order.status === 'cooking' && (
            <TouchableOpacity
              style={styles.btnReady}
              onPress={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, 'completed');
              }}
            >
              <Ionicons name="checkmark-done" size={15} color={COLORS.textWhite} />
              <Text style={styles.btnActionText}>Mark Ready</Text>
            </TouchableOpacity>
          )}

          {order.status === 'completed' && (
            <TouchableOpacity
              style={styles.btnDeliver}
              onPress={(e) => {
                e.stopPropagation();
                updateOrderStatus(order._id, 'delivered');
              }}
            >
              <Ionicons name="bag-check" size={15} color={COLORS.textWhite} />
              <Text style={styles.btnActionText}>Delivered</Text>
            </TouchableOpacity>
          )}

          {order.status === 'delivered' && (
            <View style={styles.fulfilledBadge}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
              <Text style={styles.fulfilledText}>Fulfilled</Text>
            </View>
          )}

          {order.status === 'cancelled' && (
            <View style={styles.cancelledBadge}>
              <Ionicons name="close-circle" size={13} color={COLORS.danger} />
              <Text style={styles.cancelledText}>Cancelled</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: 0.2,
  },
  orderNo: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
  },
  tablePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  customerDot: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemsContainer: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    width: 24,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  variantBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  variantBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  notesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 5,
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 2,
  },
  totalBlock: {
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 3,
  },
  btnRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  btnCooking: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    ...SHADOWS.sm,
  },
  btnReady: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
    ...SHADOWS.sm,
  },
  btnDeliver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
    ...SHADOWS.sm,
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  fulfilledText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  cancelledText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
