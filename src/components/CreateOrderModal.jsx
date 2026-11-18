// src/components/CreateOrderModal.jsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';

const extract10Digits = (val) => {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

const isValidIndianMobile = (p) => /^[6-9]\d{9}$/.test(p);

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getUpcomingDates = (count = 14) => {
  const dates = [];
  const now = new Date();
  for (let i = 2; i <= count; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    dates.push({ dateStr, weekday, formatted });
  }
  return dates;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
};

export const CreateOrderModal = ({ visible, onClose }) => {
  const { items, categories, createNewOrder } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateType, setDateType] = useState('today'); // 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState(getTodayDateString());

  // Time handling:
  // When date is 'today', can pick ASAP or Scheduled time
  // When date is NOT 'today', ASAP is completely hidden / not available
  const [timeMode, setTimeMode] = useState('asap'); // 'asap' | 'custom'
  const [hour, setHour] = useState('04');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('PM');

  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { itemId, name, variant, qty, price }

  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Track selected weight variant per item in the picker list
  const [itemVariantSelections, setItemVariantSelections] = useState({});

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setDateType('today');
    setCustomDate(getTodayDateString());
    setTimeMode('asap');
    setHour('04');
    setMinute('00');
    setPeriod('PM');
    setNotes('');
    setSelectedItems([]);
    setSearchItemQuery('');
    setSelectedCatFilter('all');
    setItemVariantSelections({});
  };

  const handleHourStep = (delta) => {
    const h = parseInt(hour, 10) || 4;
    let nextH = h + delta;
    if (nextH > 12) nextH = 1;
    if (nextH < 1) nextH = 12;
    setHour(String(nextH).padStart(2, '0'));
  };

  const handleMinuteStep = (delta) => {
    const m = parseInt(minute, 10) || 0;
    let nextM = m + delta * 5;
    if (nextM >= 60) nextM = 0;
    if (nextM < 0) nextM = 55;
    setMinute(String(nextM).padStart(2, '0'));
  };

  const togglePeriod = () => {
    setPeriod((p) => (p === 'AM' ? 'PM' : 'AM'));
  };

  const handleQuickTime = (str) => {
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      setHour(match[1].padStart(2, '0'));
      setMinute(match[2]);
      setPeriod(match[3].toUpperCase());
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter available menu items
  const filteredCatalog = useMemo(() => {
    return items.filter((it) => {
      if (selectedCatFilter !== 'all' && String(it.categoryId) !== String(selectedCatFilter)) {
        return false;
      }
      if (searchItemQuery.trim()) {
        const q = searchItemQuery.toLowerCase();
        return (
          it.name.toLowerCase().includes(q) ||
          (it.description && it.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, selectedCatFilter, searchItemQuery]);

  // Set variant for an item in the selector
  const handleSelectVariant = (itemId, variantObj) => {
    setItemVariantSelections((prev) => ({
      ...prev,
      [itemId]: variantObj,
    }));
  };

  // Add an item to the order basket
  const handleAddItemToOrder = (item) => {
    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
    const chosenVariant = hasVariants
      ? itemVariantSelections[item._id] || item.variants[0]
      : null;

    const variantWeight = chosenVariant ? chosenVariant.weight : '';
    const variantPrice = chosenVariant
      ? Number(chosenVariant.offerPrice || chosenVariant.price)
      : Number(item.offer && item.offerPrice ? item.offerPrice : item.price);

    const lineItemId = chosenVariant
      ? `${item._id}_${chosenVariant.weight}`
      : String(item._id);

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.lineItemId === lineItemId);
      if (existing) {
        return prev.map((i) =>
          i.lineItemId === lineItemId ? { ...i, qty: Math.min(5, i.qty + 1) } : i
        );
      }
      return [
        ...prev,
        {
          lineItemId,
          itemId: item._id,
          name: item.name,
          variant: variantWeight,
          price: variantPrice,
          qty: 1,
        },
      ];
    });
  };

  // Update quantity in order basket (deselect when reaching 0, max 5)
  const handleUpdateQty = (lineItemId, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.lineItemId === lineItemId) {
            const newQty = i.qty + delta;
            if (newQty <= 0) return null; // Deselected / removed from basket
            return { ...i, qty: Math.min(5, newQty) }; // Max 5
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveLineItem = (lineItemId) => {
    setSelectedItems((prev) => prev.filter((i) => i.lineItemId !== lineItemId));
  };

  const orderTotal = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [selectedItems]);

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.qty, 0);
  }, [selectedItems]);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      const msg = 'Please enter customer name.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Name', msg);
      return;
    }
    if (!phone.trim()) {
      const msg = 'Please enter user phone number.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Phone', msg);
      return;
    }
    if (!isValidIndianMobile(phone)) {
      const msg = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9847123456).';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Invalid Mobile Number', msg);
      return;
    }
    if (selectedItems.length === 0) {
      const msg = 'Please add at least one cake/item to the order.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('No Items', msg);
      return;
    }

    if (dateType === 'custom' && customDate < getTodayDateString()) {
      const msg = 'Previous dates cannot be selected. Please choose today or a future date.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Invalid Date', msg);
      return;
    }

    const isToday = dateType === 'today';
    const resolvedDate =
      dateType === 'today'
        ? 'Today'
        : dateType === 'tomorrow'
        ? 'Tomorrow'
        : formatDisplayDate(customDate);

    const resolvedTime =
      isToday && timeMode === 'asap'
        ? 'ASAP (~30m)'
        : `${hour}:${minute} ${period}`;

    const payload = {
      name: customerName.trim(),
      customerName: customerName.trim(),
      phone: `+91 ${phone.trim()}`,
      date: resolvedDate,
      time: resolvedTime,
      table: 'Takeaway',
      notes: notes.trim(),
      items: selectedItems.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        variant: i.variant,
        qty: i.qty,
        price: i.price,
      })),
    };

    await createNewOrder(payload);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTitleRow}>
                <Ionicons name="receipt" size={20} color={COLORS.primaryDark} />
                <Text style={styles.modalTitle}>Create New Order</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                Add manual phone, counter, or WhatsApp cake orders
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Customer Details Form */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Customer Information</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Customer Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={COLORS.textLight}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>User Phone (10 digits) *</Text>
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="98471 23456"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(val) => setPhone(extract10Digits(val))}
                    />
                    {phone.length === 10 && isValidIndianMobile(phone) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={COLORS.success}
                        style={{ marginRight: 6 }}
                      />
                    )}
                  </View>
                  {phone.length > 0 && !isValidIndianMobile(phone) && (
                    <Text style={styles.phoneErrorText}>
                      {phone.length < 10
                        ? `${10 - phone.length} more digit${10 - phone.length === 1 ? '' : 's'} needed`
                        : 'Must start with 6, 7, 8, or 9'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Order Date & Pickup Time (Unified Schedule) */}
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.inputLabel}>Delivery / Pickup Schedule *</Text>
                  </View>
                  <View style={styles.todayDefaultBadge}>
                    <Text style={styles.todayDefaultText}>
                      {dateType === 'today'
                        ? `Today • ${timeMode === 'asap' ? 'ASAP' : `${hour}:${minute} ${period}`}`
                        : dateType === 'tomorrow'
                        ? `Tomorrow • ${hour}:${minute} ${period}`
                        : `${formatDisplayDate(customDate)} • ${hour}:${minute} ${period}`}
                    </Text>
                  </View>
                </View>

                {/* 1. Date Pills */}
                <Text style={styles.subStepLabel}>1. Choose Date</Text>
                <View style={styles.datePillRow}>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'tomorrow', label: 'Tomorrow' },
                    {
                      key: 'custom',
                      label: dateType === 'custom' && customDate ? `📅 ${formatDisplayDate(customDate)}` : 'Pick Date 📅',
                    },
                  ].map((d) => {
                    const isSelected = dateType === d.key;
                    return (
                      <TouchableOpacity
                        key={d.key}
                        style={[styles.datePill, isSelected && styles.datePillActive]}
                        onPress={() => {
                          setDateType(d.key);
                          if (d.key !== 'today') {
                            setTimeMode('custom');
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.datePillText,
                            isSelected && styles.datePillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Upcoming 14 Days Scroll when Pick Date is active */}
                {dateType === 'custom' && (
                  <View style={styles.upcomingDatesBox}>
                    <Text style={styles.upcomingDatesTitle}>
                      Upcoming Days (Previous dates blocked):
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.upcomingDatesScroll}
                    >
                      {getUpcomingDates(14).map((d) => {
                        const isSelected = customDate === d.dateStr;
                        return (
                          <TouchableOpacity
                            key={d.dateStr}
                            style={[
                              styles.upcomingDateChip,
                              isSelected && styles.upcomingDateChipActive,
                            ]}
                            onPress={() => {
                              setCustomDate(d.dateStr);
                              setTimeMode('custom');
                            }}
                          >
                            <Text
                              style={[
                                styles.upcomingDateWeekday,
                                isSelected && styles.upcomingDateTextActive,
                              ]}
                            >
                              {d.weekday}
                            </Text>
                            <Text
                              style={[
                                styles.upcomingDateText,
                                isSelected && styles.upcomingDateTextActive,
                              ]}
                            >
                              {d.formatted}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* 2. Time Selection (Auto provided together with Date) */}
                <Text style={[styles.subStepLabel, { marginTop: 10 }]}>2. Choose Time</Text>
                {dateType === 'today' ? (
                  /* Today: Can toggle ASAP or Set Exact Time */
                  <View style={{ gap: 8 }}>
                    <View style={styles.timeModeRow}>
                      <TouchableOpacity
                        style={[styles.timeModeBtn, timeMode === 'asap' && styles.timeModeBtnActive]}
                        onPress={() => setTimeMode('asap')}
                      >
                        <Ionicons
                          name="flash"
                          size={13}
                          color={timeMode === 'asap' ? '#FFF' : COLORS.primary}
                        />
                        <Text
                          style={[
                            styles.timeModeBtnText,
                            timeMode === 'asap' && styles.timeModeBtnTextActive,
                          ]}
                        >
                          ASAP (~30m)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.timeModeBtn, timeMode === 'custom' && styles.timeModeBtnActive]}
                        onPress={() => setTimeMode('custom')}
                      >
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={timeMode === 'custom' ? '#FFF' : COLORS.textPrimary}
                        />
                        <Text
                          style={[
                            styles.timeModeBtnText,
                            timeMode === 'custom' && styles.timeModeBtnTextActive,
                          ]}
                        >
                          Scheduled Time
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {timeMode === 'custom' && (
                      <View style={styles.alarmTimeCard}>
                        {/* Alarm Stepper */}
                        <View style={styles.steppersRow}>
                          {/* Hour */}
                          <View style={styles.timeWheelCol}>
                            <Text style={styles.wheelLabel}>Hour</Text>
                            <View style={styles.unitStepper}>
                              <TouchableOpacity style={styles.unitBtn} onPress={() => handleHourStep(-1)}>
                                <Ionicons name="remove" size={13} color={COLORS.primaryDark} />
                              </TouchableOpacity>
                              <Text style={styles.unitValue}>{hour}</Text>
                              <TouchableOpacity style={styles.unitBtn} onPress={() => handleHourStep(1)}>
                                <Ionicons name="add" size={13} color={COLORS.primaryDark} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <Text style={styles.timeColon}>:</Text>

                          {/* Minute */}
                          <View style={styles.timeWheelCol}>
                            <Text style={styles.wheelLabel}>Minute</Text>
                            <View style={styles.unitStepper}>
                              <TouchableOpacity style={styles.unitBtn} onPress={() => handleMinuteStep(-1)}>
                                <Ionicons name="remove" size={13} color={COLORS.primaryDark} />
                              </TouchableOpacity>
                              <Text style={styles.unitValue}>{minute}</Text>
                              <TouchableOpacity style={styles.unitBtn} onPress={() => handleMinuteStep(1)}>
                                <Ionicons name="add" size={13} color={COLORS.primaryDark} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Period */}
                          <View style={styles.timeWheelCol}>
                            <Text style={styles.wheelLabel}>AM / PM</Text>
                            <TouchableOpacity style={styles.periodToggleBtn} onPress={togglePeriod}>
                              <Text style={styles.periodText}>{period}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Quick Chips */}
                        <View style={styles.quickTimeRow}>
                          {['10:00 AM', '01:00 PM', '04:00 PM', '06:30 PM', '08:00 PM'].map((qTime) => {
                            const isQSelected = `${hour}:${minute} ${period}` === qTime;
                            return (
                              <TouchableOpacity
                                key={qTime}
                                style={[styles.quickTimeChip, isQSelected && styles.quickTimeChipActive]}
                                onPress={() => handleQuickTime(qTime)}
                              >
                                <Text
                                  style={[
                                    styles.quickTimeText,
                                    isQSelected && styles.quickTimeTextActive,
                                  ]}
                                >
                                  {qTime}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  /* Tomorrow / Future Date: ASAP is strictly hidden. Alarm Stepper is provided */
                  <View style={styles.alarmTimeCard}>
                    <View style={styles.steppersRow}>
                      {/* Hour */}
                      <View style={styles.timeWheelCol}>
                        <Text style={styles.wheelLabel}>Hour</Text>
                        <View style={styles.unitStepper}>
                          <TouchableOpacity style={styles.unitBtn} onPress={() => handleHourStep(-1)}>
                            <Ionicons name="remove" size={13} color={COLORS.primaryDark} />
                          </TouchableOpacity>
                          <Text style={styles.unitValue}>{hour}</Text>
                          <TouchableOpacity style={styles.unitBtn} onPress={() => handleHourStep(1)}>
                            <Ionicons name="add" size={13} color={COLORS.primaryDark} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.timeColon}>:</Text>

                      {/* Minute */}
                      <View style={styles.timeWheelCol}>
                        <Text style={styles.wheelLabel}>Minute</Text>
                        <View style={styles.unitStepper}>
                          <TouchableOpacity style={styles.unitBtn} onPress={() => handleMinuteStep(-1)}>
                            <Ionicons name="remove" size={13} color={COLORS.primaryDark} />
                          </TouchableOpacity>
                          <Text style={styles.unitValue}>{minute}</Text>
                          <TouchableOpacity style={styles.unitBtn} onPress={() => handleMinuteStep(1)}>
                            <Ionicons name="add" size={13} color={COLORS.primaryDark} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Period */}
                      <View style={styles.timeWheelCol}>
                        <Text style={styles.wheelLabel}>AM / PM</Text>
                        <TouchableOpacity style={styles.periodToggleBtn} onPress={togglePeriod}>
                          <Text style={styles.periodText}>{period}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Quick Chips */}
                    <View style={styles.quickTimeRow}>
                      {['10:00 AM', '01:00 PM', '04:00 PM', '06:30 PM', '08:00 PM'].map((qTime) => {
                        const isQSelected = `${hour}:${minute} ${period}` === qTime;
                        return (
                          <TouchableOpacity
                            key={qTime}
                            style={[styles.quickTimeChip, isQSelected && styles.quickTimeChipActive]}
                            onPress={() => handleQuickTime(qTime)}
                          >
                            <Text
                              style={[
                                styles.quickTimeText,
                                isQSelected && styles.quickTimeTextActive,
                              ]}
                            >
                              {qTime}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Special Note / Cake Inscription */}
              <Text style={styles.inputLabel}>Special Request / Cake Inscription Note</Text>
              <TextInput
                style={[styles.textInput, styles.noteInput]}
                placeholder="e.g. Write 'Happy 25th Anniversary Mom & Dad' in chocolate ganache..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Selected Items Basket */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cart-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>
                  Order Items ({totalItemCount})
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.sectionSubtotal}>Subtotal: ₹{orderTotal}</Text>
              </View>

              {selectedItems.length === 0 ? (
                <View style={styles.emptyBasketBox}>
                  <Ionicons name="gift-outline" size={24} color={COLORS.textLight} />
                  <Text style={styles.emptyBasketText}>
                    No items selected yet. Choose cakes from the menu catalog below.
                  </Text>
                </View>
              ) : (
                <View style={styles.basketList}>
                  {selectedItems.map((item) => (
                    <View key={item.lineItemId} style={styles.basketItemRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.basketItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.variant ? (
                            <View style={styles.basketVariantBadge}>
                              <Text style={styles.basketVariantText}>{item.variant}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.basketItemPrice}>
                          ₹{item.price} each • ₹{item.price * item.qty}
                        </Text>
                      </View>

                      {/* Quantity Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateQty(item.lineItemId, -1)}
                        >
                          <Ionicons name="remove" size={14} color={COLORS.primaryDark} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQty}>{item.qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepperBtn, item.qty >= 5 && { opacity: 0.3 }]}
                          disabled={item.qty >= 5}
                          onPress={() => item.qty < 5 && handleUpdateQty(item.lineItemId, 1)}
                        >
                          <Ionicons name="add" size={14} color={COLORS.primaryDark} />
                        </TouchableOpacity>
                      </View>

                      {/* Remove Button */}
                      <TouchableOpacity
                        style={styles.removeLineBtn}
                        onPress={() => handleRemoveLineItem(item.lineItemId)}
                      >
                        <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Menu Items Catalog Picker */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="grid-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Add Cakes & Items from Catalog</Text>
              </View>

              {/* Search & Category Filter */}
              <View style={styles.catalogSearchRow}>
                <Ionicons name="search" size={15} color={COLORS.textLight} />
                <TextInput
                  style={styles.catalogSearchInput}
                  placeholder="Search catalog items..."
                  placeholderTextColor={COLORS.textLight}
                  value={searchItemQuery}
                  onChangeText={setSearchItemQuery}
                />
                {searchItemQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchItemQuery('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
              >
                <TouchableOpacity
                  style={[
                    styles.catFilterPill,
                    selectedCatFilter === 'all' && styles.catFilterPillActive,
                  ]}
                  onPress={() => setSelectedCatFilter('all')}
                >
                  <Text
                    style={[
                      styles.catFilterText,
                      selectedCatFilter === 'all' && styles.catFilterTextActive,
                    ]}
                  >
                    All ({items.length})
                  </Text>
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[
                      styles.catFilterPill,
                      selectedCatFilter === c._id && styles.catFilterPillActive,
                    ]}
                    onPress={() => setSelectedCatFilter(c._id)}
                  >
                    <Text
                      style={[
                        styles.catFilterText,
                        selectedCatFilter === c._id && styles.catFilterTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Item Cards to Pick */}
              <View style={styles.catalogItemsList}>
                {filteredCatalog.map((it) => {
                  const hasVariants = Array.isArray(it.variants) && it.variants.length > 0;
                  const activeVariant = hasVariants
                    ? itemVariantSelections[it._id] || it.variants[0]
                    : null;
                  const activePrice = activeVariant
                    ? (activeVariant.offerPrice || activeVariant.price)
                    : (it.offer && it.offerPrice ? it.offerPrice : it.price);

                  return (
                    <View key={it._id} style={styles.catalogCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catalogItemName}>{it.name}</Text>
                        <Text style={styles.catalogItemPrice}>₹{activePrice}</Text>

                        {/* Weight Variants Chips if cake has variants */}
                        {hasVariants && (
                          <View style={styles.variantChipsGroup}>
                            {it.variants.map((v, vIdx) => {
                              const isVariantActive =
                                activeVariant && activeVariant.weight === v.weight;
                              return (
                                <TouchableOpacity
                                  key={vIdx}
                                  style={[
                                    styles.variantChipBtn,
                                    isVariantActive && styles.variantChipBtnActive,
                                  ]}
                                  onPress={() => handleSelectVariant(it._id, v)}
                                >
                                  <Text
                                    style={[
                                      styles.variantChipBtnText,
                                      isVariantActive && styles.variantChipBtnTextActive,
                                    ]}
                                  >
                                    {v.weight} (₹{v.price})
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* Add Button */}
                      <TouchableOpacity
                        style={styles.addCatalogItemBtn}
                        onPress={() => handleAddItemToOrder(it)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={16} color={COLORS.textWhite} />
                        <Text style={styles.addCatalogItemBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer with Summary and Action Buttons */}
          <View style={styles.footer}>
            <View style={styles.footerSummary}>
              <Text style={styles.footerItemCount}>{totalItemCount} items selected</Text>
              <Text style={styles.footerTotal}>Total: ₹{orderTotal}</Text>
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  selectedItems.length === 0 && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={selectedItems.length === 0}
              >
                <Ionicons name="checkmark-circle" size={18} color={COLORS.textWhite} />
                <Text style={styles.submitBtnText}>Place Order (₹{orderTotal})</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '94%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtotal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  countryCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  phoneErrorText: {
    fontSize: 9,
    color: COLORS.danger,
    marginTop: 2,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginBottom: 6,
  },
  dateTimeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  todayDefaultBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayDefaultText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  datePillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  datePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  datePillTextActive: {
    color: COLORS.textWhite,
    fontWeight: '800',
  },
  subStepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  upcomingDatesBox: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  upcomingDatesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  upcomingDatesScroll: {
    gap: 6,
  },
  upcomingDateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 64,
  },
  upcomingDateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  upcomingDateWeekday: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  upcomingDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  upcomingDateTextActive: {
    color: COLORS.textWhite,
  },
  timeModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeModeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeModeBtnTextActive: {
    color: COLORS.textWhite,
    fontWeight: '800',
  },
  alarmTimeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 8,
  },
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timeWheelCol: {
    alignItems: 'center',
    gap: 3,
  },
  wheelLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  unitStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
    paddingHorizontal: 8,
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 12,
  },
  periodToggleBtn: {
    height: 28,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 2,
  },
  quickTimeChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  quickTimeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickTimeTextActive: {
    color: COLORS.textWhite,
    fontWeight: '800',
  },
  emptyBasketBox: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyBasketText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  basketList: {
    gap: 8,
  },
  basketItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  basketItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  basketVariantBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  basketVariantText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  basketItemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    paddingHorizontal: 6,
  },
  removeLineBtn: {
    padding: 6,
  },
  catalogSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
    marginBottom: 8,
  },
  catalogSearchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  catScroll: {
    marginBottom: 8,
  },
  catFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catFilterTextActive: {
    color: COLORS.textWhite,
    fontWeight: '800',
  },
  catalogItemsList: {
    gap: 8,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  catalogItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catalogItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  variantChipsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  variantChipBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantChipBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  variantChipBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  variantChipBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  addCatalogItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 3,
  },
  addCatalogItemBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerItemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footerTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    gap: 6,
    ...SHADOWS.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
});
