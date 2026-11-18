// src/components/OrderDetailModal.jsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { StatusBadge } from './StatusBadge';
import { useApp } from '../context/AppContext';

export const OrderDetailModal = ({ order, visible, onClose }) => {
  const { updateOrderStatus, revertOrderStatus, cancelOrder } = useApp();

  if (!order) return null;

  const handleCall = () => {
    if (order.phone) {
      Linking.openURL(`tel:${order.phone}`).catch(() => {
        if (Platform.OS === 'web') {
          window.alert(`Customer phone: ${order.phone}`);
        } else {
          Alert.alert('Phone Number', order.phone);
        }
      });
    }
  };

  const handleCancel = () => {
    const doCancel = () => {
      cancelOrder(order._id, 'Cancelled via staff app');
      onClose();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this order?')) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'Keep Order', style: 'cancel' },
          { text: 'Cancel Order', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  const handleRevert = () => {
    revertOrderStatus(order._id);
    onClose();
  };

  const getRevertTarget = () => {
    if (order.status === 'cooking') return 'Pending';
    if (order.status === 'completed') return 'Cooking';
    if (order.status === 'delivered') return 'Ready';
    if (order.status === 'cancelled') return 'Reopen (Pending)';
    return null;
  };

  const revertTarget = getRevertTarget();

  const formattedDate = new Date(order.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.orderIdentRow}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>
                    Order #{order.orderNumber || order.orderNo?.replace('ORD-', '') || '101'}
                  </Text>
                </View>
                <Text style={styles.orderNumber}>{order.orderNo}</Text>
              </View>
              <Text style={styles.orderTime}>
                Ordered at {formattedDate} • {new Date(order.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <StatusBadge status={order.status} />
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Customer Details Card */}
            <View style={styles.customerCard}>
              <View style={styles.customerIconContainer}>
                <Ionicons name="person" size={20} color={COLORS.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{order.customerName || order.name || 'Customer'}</Text>
                <Text style={styles.customerPhone}>{order.phone}</Text>
                <View style={styles.tableTag}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.primaryDark} />
                  <Text style={styles.tableText}>
                    {order.date ? `${order.date} • ${order.time || 'ASAP'}` : (order.table || 'Today')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={16} color={COLORS.textWhite} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Special Instructions / Message on Cake */}
            {order.notes && (
              <View style={styles.notesContainer}>
                <View style={styles.notesHeader}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.notesTitle}>Special Request / Cake Inscription</Text>
                </View>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            )}

            {/* Itemized Order List */}
            <Text style={styles.sectionTitle}>Ordered Items ({order.items.length})</Text>
            <View style={styles.itemsList}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.qty}x</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.variant ? (
                        <View style={styles.variantTag}>
                          <Text style={styles.variantTagText}>{item.variant}</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.addons && item.addons.length > 0 && (
                      <View style={styles.addonsWrapper}>
                        {item.addons.map((ad, idx) => (
                          <Text key={idx} style={styles.addonTag}>
                            + {typeof ad === 'string' ? ad : ad.name}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
                </View>
              ))}
            </View>

            {/* Duration Tracking (if cooking or finished) */}
            {order.durationMinutes && (
              <View style={styles.durationCard}>
                <Ionicons name="timer-outline" size={18} color={COLORS.info} />
                <Text style={styles.durationText}>
                  Kitchen Prep Duration: <Text style={{ fontWeight: '700' }}>{order.durationMinutes} minutes</Text>
                </Text>
              </View>
            )}

            {/* Bill Summary */}
            <View style={styles.billBox}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billValue}>₹{order.total}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & Packaging</Text>
                <Text style={styles.billValue}>Included</Text>
              </View>
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>₹{order.total}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer: Primary Progression Button + Small Revert Option */}
          <View style={styles.footerContainer}>
            <View style={styles.actionsFooter}>
              {order.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={handleCancel}
                  >
                    <Ionicons name="close" size={16} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryActionBtn]}
                    onPress={() => {
                      updateOrderStatus(order._id, 'cooking');
                      onClose();
                    }}
                  >
                    <Ionicons name="flame" size={16} color={COLORS.textWhite} />
                    <Text style={styles.primaryActionBtnText}>Accept & Start Cooking</Text>
                  </TouchableOpacity>
                </>
              )}

              {order.status === 'cooking' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.readyActionBtn]}
                  onPress={() => {
                    updateOrderStatus(order._id, 'completed');
                    onClose();
                  }}
                >
                  <Ionicons name="checkmark-done" size={18} color={COLORS.textWhite} />
                  <Text style={styles.primaryActionBtnText}>Mark Ready / Baked</Text>
                </TouchableOpacity>
              )}

              {order.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deliverActionBtn]}
                  onPress={() => {
                    updateOrderStatus(order._id, 'delivered');
                    onClose();
                  }}
                >
                  <Ionicons name="bag-check" size={18} color={COLORS.textWhite} />
                  <Text style={styles.primaryActionBtnText}>Complete Delivery</Text>
                </TouchableOpacity>
              )}

              {order.status === 'delivered' && (
                <View style={styles.deliveredNotice}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.deliveredNoticeText}>Order Delivered & Fulfilled</Text>
                </View>
              )}

              {order.status === 'cancelled' && (
                <View style={styles.cancelledNotice}>
                  <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                  <Text style={styles.cancelledNoticeText}>Order Cancelled</Text>
                </View>
              )}
            </View>

            {/* Small Revert Option (only visible inside modal overlay) */}
            {revertTarget && (
              <TouchableOpacity
                style={styles.smallRevertRow}
                onPress={handleRevert}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-undo-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.smallRevertText}>
                  ↩ Revert status to {revertTarget}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  orderIdentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  customerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  tableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  tableText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  notesContainer: {
    backgroundColor: '#FEF8EE',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  itemsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  variantTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  variantTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  addonsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  addonTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  durationText: {
    fontSize: 13,
    color: COLORS.info,
  },
  billBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  actionsFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    ...SHADOWS.sm,
  },
  rejectBtn: {
    flex: 0.35,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
  },
  readyActionBtn: {
    backgroundColor: COLORS.info,
  },
  deliverActionBtn: {
    backgroundColor: COLORS.success,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  deliveredNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    gap: 6,
  },
  deliveredNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  cancelledNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    gap: 6,
  },
  cancelledNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  smallRevertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
    gap: 5,
  },
  smallRevertText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
