// src/context/AppContext.js
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
} from '../data/initialData';
import * as api from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [company, setCompany] = useState(api.DEFAULT_COMPANY);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [webLayoutMode, setWebLayoutMode] = useState('mobile'); // 'mobile' | 'wide'

  // Load initial standalone data from persistent storage
  const reloadFromStorage = useCallback(async () => {
    try {
      const comp = await api.getCompany();
      if (comp) setCompany(comp);

      const menuData = await api.getMenu(comp ? comp._id : 'comp-lavino-01');
      if (menuData) {
        if (menuData.categories && menuData.categories.length > 0) {
          setCategories(menuData.categories);
        }
        if (menuData.allItems && menuData.allItems.length > 0) {
          setItems(menuData.allItems);
        }
      }

      const liveOrders = await api.getOrders(comp ? comp._id : 'comp-lavino-01');
      if (liveOrders && Array.isArray(liveOrders)) {
        setOrders(liveOrders);
      }

      const custs = await api.getCustomers(comp ? comp._id : 'comp-lavino-01');
      if (custs && Array.isArray(custs)) {
        setCustomers(custs);
      }
    } catch (err) {
      console.warn('[AppContext] Storage initialization warning:', err);
    }
  }, []);

  useEffect(() => {
    reloadFromStorage();

    // Cross-tab real-time sync for web browser
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorageEvent = (e) => {
        if (e.key && e.key.startsWith('lavino_standalone_')) {
          reloadFromStorage();
        }
      };
      window.addEventListener('storage', handleStorageEvent);
      return () => {
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
  }, [reloadFromStorage]);

  // --- ORDER ACTIONS ---

  /**
   * Advances order status to next stage
   */
  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic local update
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;

        const updated = { ...order, status: newStatus };

        if (newStatus === 'completed' || newStatus === 'delivered' || newStatus === 'served') {
          if (!updated.endTime) {
            updated.endTime = new Date().toISOString();
            const startMs = new Date(updated.startTime).getTime();
            const endMs = new Date(updated.endTime).getTime();
            updated.durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
          }
        }
        return updated;
      })
    );

    // Standalone persistent storage sync
    await api.updateOrderStatus(company?._id, orderId, newStatus);
  };

  /**
   * Reverts order status backwards
   */
  const revertOrderStatus = async (orderId) => {
    let nextStatus = 'pending';

    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;

        let prevStatus = order.status;
        const updated = { ...order };

        if (order.status === 'cooking' || order.status === 'preparing') {
          prevStatus = 'pending';
        } else if (order.status === 'completed' || order.status === 'served') {
          prevStatus = 'cooking';
          delete updated.endTime;
          delete updated.durationMinutes;
        } else if (order.status === 'delivered') {
          prevStatus = 'completed';
        } else if (order.status === 'cancelled') {
          prevStatus = 'pending';
          delete updated.cancelReason;
        }

        nextStatus = prevStatus;
        updated.status = prevStatus;
        return updated;
      })
    );

    await api.updateOrderStatus(company?._id, orderId, nextStatus);
  };

  /**
   * Cancel an order
   */
  const cancelOrder = async (orderId, reason = 'Cancelled by kitchen staff') => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? { ...order, status: 'cancelled', cancelReason: reason }
          : order
      )
    );

    await api.updateOrderStatus(company?._id, orderId, 'cancelled');
  };

  /**
   * Simulate an incoming customer order (standalone demo test)
   */
  const simulateIncomingOrder = async () => {
    const randomItemsPool = items.length > 0 ? items : INITIAL_ITEMS;
    const randomCount = Math.floor(Math.random() * 2) + 1;
    const shuffled = [...randomItemsPool].sort(() => 0.5 - Math.random());
    const randomPick = shuffled.slice(0, randomCount);
    const totalCalc = randomPick.reduce((sum, it) => {
      const price = it.offer && it.offerPrice ? it.offerPrice : it.price;
      return sum + price;
    }, 0);

    const customerNames = [
      'Kavita Rao',
      'Siddharth Sen',
      'Divya Menon',
      'Rahul Kapoor',
      'Tanya Bansal',
      'Arjun Varma',
      'Sneha Pillai',
    ];
    const selectedName = customerNames[Math.floor(Math.random() * customerNames.length)];

    const maxOrderNum = orders.reduce(
      (max, o) => Math.max(max, Number(o.orderNumber) || 100),
      100
    );
    const nextOrderNumber = maxOrderNum + 1;
    const uniqueOrderNo = `ORD-${nextOrderNumber}`;

    const orderPayload = {
      orderNumber: nextOrderNumber,
      orderNo: uniqueOrderNo,
      customerName: selectedName,
      name: selectedName,
      phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      table: Math.random() > 0.4 ? `Table ${Math.floor(Math.random() * 6) + 1}` : 'Takeaway',
      date: 'Today',
      time: 'ASAP',
      notes: 'Freshly placed via Web Online Ordering (Test Simulation).',
      items: randomPick.map((it) => ({
        itemId: it._id,
        name: it.name,
        qty: 1,
        price: it.offer && it.offerPrice ? it.offerPrice : it.price,
        variant: it.variants && it.variants.length > 0 ? it.variants[0].weight : null,
        addons: [],
      })),
      total: totalCalc,
    };

    const createdOrder = await api.createOrder(company?._id, orderPayload);
    setOrders((prev) => [createdOrder, ...prev]);
    return createdOrder;
  };

  /**
   * Create a new custom/manual order from kitchen staff modal
   */
  const createNewOrder = async (orderData) => {
    const totalCalc = (orderData.items || []).reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
      0
    );

    const maxOrderNum = orders.reduce(
      (max, o) => Math.max(max, Number(o.orderNumber) || 100),
      100
    );
    const nextOrderNumber = maxOrderNum + 1;
    const uniqueOrderNo = `ORD-${nextOrderNumber}`;

    const orderPayload = {
      orderNumber: nextOrderNumber,
      orderNo: uniqueOrderNo,
      customerName: orderData.name || orderData.customerName || 'In-Store Customer',
      name: orderData.name || orderData.customerName || 'In-Store Customer',
      phone: orderData.phone || '',
      date: orderData.date || 'Today',
      time: orderData.time || 'ASAP',
      table: orderData.table || 'Takeaway',
      notes: orderData.notes || '',
      items: orderData.items || [],
      total: totalCalc,
    };

    const createdOrder = await api.createOrder(company?._id, orderPayload);
    setOrders((prev) => [createdOrder, ...prev]);
    return createdOrder;
  };

  // --- MENU ITEM & CATEGORY ACTIONS ---

  /**
   * Add a new cake/item to the menu
   */
  const addItem = async (itemData, newCategoryName = null) => {
    const newItem = await api.createMenuItem(company?._id, {
      ...itemData,
      categoryName: newCategoryName,
    });

    setItems((prev) => [newItem, ...prev]);

    // Refresh categories in case a new one was added
    const menuData = await api.getMenu(company?._id);
    if (menuData?.categories) {
      setCategories(menuData.categories);
    }
  };

  /**
   * Update an existing menu item
   */
  const updateItem = async (itemId, updatedFields, newCategoryName = null) => {
    const updated = await api.updateMenuItem(company?._id, itemId, {
      ...updatedFields,
      categoryName: newCategoryName,
    });

    setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)));

    const menuData = await api.getMenu(company?._id);
    if (menuData?.categories) {
      setCategories(menuData.categories);
    }
  };

  /**
   * Delete an item from the menu
   */
  const deleteItem = async (itemId) => {
    await api.deleteMenuItem(company?._id, itemId);
    const updatedItems = items.filter((it) => it._id !== itemId);
    setItems(updatedItems);

    const activeCatIds = new Set(updatedItems.map((i) => String(i.categoryId)));
    setCategories((prevCats) => prevCats.filter((cat) => activeCatIds.has(String(cat._id))));
  };

  /**
   * Toggle availability (in stock vs out of stock)
   */
  const toggleItemAvailability = async (itemId) => {
    const targetItem = items.find((i) => i._id === itemId);
    const newAvailable = targetItem ? !targetItem.available : true;

    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, available: newAvailable } : it))
    );

    await api.updateMenuItem(company?._id, itemId, { available: newAvailable });
  };

  /**
   * Reorder categories
   */
  const reorderCategories = async (newOrderedCategories) => {
    const withPositions = newOrderedCategories.map((cat, idx) => ({
      ...cat,
      position: idx + 1,
    }));
    setCategories(withPositions);

    const orderedIds = withPositions.map((c) => c._id);
    await api.reorderCategories(company?._id, orderedIds);
  };

  /**
   * Reset all standalone data back to default demo data
   */
  const resetAllData = () => {
    const reset = api.resetToDemoData();
    setCompany(reset.company);
    setCategories(reset.categories);
    setItems(reset.items);
    setOrders(reset.orders);
    setCustomers(reset.customers);
  };

  // --- COMPUTED ANALYTICS ---
  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRev = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const cookingCount = orders.filter((o) => o.status === 'cooking' || o.status === 'preparing').length;
    const completedCount = orders.filter((o) => o.status === 'completed' || o.status === 'served').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

    const completedOrDelivered = orders.filter(
      (o) => (o.status === 'completed' || o.status === 'delivered' || o.status === 'served') && o.durationMinutes
    );
    const avgDuration =
      completedOrDelivered.length > 0
        ? Math.round(
            completedOrDelivered.reduce((sum, o) => sum + o.durationMinutes, 0) /
              completedOrDelivered.length
          )
        : 22;

    const aov = activeOrders.length > 0 ? Math.round(totalRev / activeOrders.length) : 0;

    return {
      todayRevenue: totalRev,
      totalOrdersToday: orders.length,
      pendingCount,
      cookingCount,
      completedCount,
      deliveredCount,
      cancelledCount,
      averageOrderValue: aov,
      avgPrepTimeMinutes: avgDuration,
    };
  }, [orders]);

  const value = {
    company,
    isLiveConnected,
    categories,
    items,
    orders,
    customers,
    isShopOpen,
    setIsShopOpen,
    activeStatusFilter,
    setActiveStatusFilter,
    webLayoutMode,
    setWebLayoutMode,
    updateOrderStatus,
    revertOrderStatus,
    cancelOrder,
    simulateIncomingOrder,
    createNewOrder,
    addItem,
    updateItem,
    deleteItem,
    reorderCategories,
    toggleItemAvailability,
    resetAllData,
    stats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
