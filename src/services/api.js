// src/services/api.js
/**
 * Standalone Client-Side API & Persistent Storage Service
 *
 * Runs 100% in the frontend with zero backend dependencies.
 * Persists data to window.localStorage in web browsers and falls back
 * to memory for mobile/native runtimes.
 */

import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
} from '../data/initialData';

const STORAGE_KEYS = {
  COMPANY: 'lavino_standalone_company_v2',
  CATEGORIES: 'lavino_standalone_categories_v2',
  ITEMS: 'lavino_standalone_items_v2',
  ORDERS: 'lavino_standalone_orders_v2',
  CUSTOMERS: 'lavino_standalone_customers_v2',
  SHOP_OPEN: 'lavino_standalone_shop_open_v2',
};

export const DEFAULT_COMPANY = {
  _id: 'comp-lavino-01',
  name: 'Lavino Cake Studio',
  tagline: 'Cherupuzha • Cake Studio & Kitchen',
  location: 'Cherupuzha, Kerala',
  phone: '+91 98765 43210',
  email: 'orders@lavinocakes.com',
  currency: '₹',
  isShopOpen: true,
};

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

// In-memory fallback cache
const memoryCache = {
  company: { ...DEFAULT_COMPANY },
  categories: [...INITIAL_CATEGORIES],
  items: [...INITIAL_ITEMS],
  orders: [...INITIAL_ORDERS],
  customers: [...INITIAL_CUSTOMERS],
  shopOpen: true,
};

function readStorage(key, fallback) {
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`[Standalone API] Error reading ${key}:`, e);
    }
  }
  return fallback;
}

function writeStorage(key, value) {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Standalone API] Error writing ${key}:`, e);
    }
  }
}

/**
 * Fetch company information
 */
export async function getCompany() {
  const company = readStorage(STORAGE_KEYS.COMPANY, memoryCache.company);
  memoryCache.company = company;
  return company;
}

/**
 * Fetch menu items and categories
 */
export async function getMenu(companyId) {
  const categories = readStorage(STORAGE_KEYS.CATEGORIES, memoryCache.categories);
  const items = readStorage(STORAGE_KEYS.ITEMS, memoryCache.items);
  memoryCache.categories = categories;
  memoryCache.items = items;
  return {
    categories,
    allItems: items,
  };
}

/**
 * Fetch live and past orders
 */
export async function getOrders(companyId) {
  const orders = readStorage(STORAGE_KEYS.ORDERS, memoryCache.orders);
  memoryCache.orders = orders;
  return orders;
}

/**
 * Fetch customer list / CRM
 */
export async function getCustomers(companyId) {
  const customers = readStorage(STORAGE_KEYS.CUSTOMERS, memoryCache.customers);
  memoryCache.customers = customers;
  return customers;
}

/**
 * Update order status (advance, revert, or cancel)
 */
export async function updateOrderStatus(companyId, orderId, status) {
  const orders = readStorage(STORAGE_KEYS.ORDERS, memoryCache.orders);
  let updatedOrder = null;

  const nextOrders = orders.map((order) => {
    if (order._id !== orderId) return order;

    const copy = { ...order, status };

    if (status === 'completed' || status === 'delivered' || status === 'served') {
      if (!copy.endTime) {
        copy.endTime = new Date().toISOString();
        const startMs = new Date(copy.startTime).getTime();
        const endMs = new Date(copy.endTime).getTime();
        copy.durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
      }
    } else if (status === 'pending' || status === 'cooking' || status === 'preparing') {
      delete copy.endTime;
      delete copy.durationMinutes;
      if (status !== 'cancelled') {
        delete copy.cancelReason;
      }
    }

    updatedOrder = copy;
    return copy;
  });

  writeStorage(STORAGE_KEYS.ORDERS, nextOrders);
  memoryCache.orders = nextOrders;
  return updatedOrder;
}

/**
 * Create a new order (from simulation or staff entry)
 */
export async function createOrder(companyId, orderData) {
  const orders = readStorage(STORAGE_KEYS.ORDERS, memoryCache.orders);

  // Compute next continuous sequential order number
  const maxOrderNumber = orders.reduce(
    (max, o) => Math.max(max, Number(o.orderNumber) || 100),
    100
  );
  const nextOrderNumber = maxOrderNumber + 1;
  const uniqueOrderNo = orderData.orderNo || `ORD-${nextOrderNumber}`;

  const newOrder = {
    _id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderNumber: nextOrderNumber,
    orderNo: uniqueOrderNo,
    customerName: orderData.customerName || orderData.name || 'Customer',
    phone: orderData.phone || '+91 98765 00000',
    table: orderData.table || 'Takeaway',
    date: orderData.date || 'Today',
    time: orderData.time || 'ASAP',
    status: orderData.status || 'pending',
    total: orderData.total || 0,
    startTime: orderData.startTime || new Date().toISOString(),
    notes: orderData.notes || '',
    items: Array.isArray(orderData.items) ? orderData.items : [],
  };

  const nextOrders = [newOrder, ...orders];
  writeStorage(STORAGE_KEYS.ORDERS, nextOrders);
  memoryCache.orders = nextOrders;
  return newOrder;
}

/**
 * Create a new cake/menu item
 */
export async function createMenuItem(companyId, itemData) {
  const items = readStorage(STORAGE_KEYS.ITEMS, memoryCache.items);
  const categories = readStorage(STORAGE_KEYS.CATEGORIES, memoryCache.categories);

  let targetCatId = itemData.categoryId;
  let nextCategories = [...categories];

  // If a new category name was provided, create it automatically
  if (itemData.categoryName && itemData.categoryName.trim()) {
    const trimmed = itemData.categoryName.trim();
    let existing = nextCategories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      existing = {
        _id: `cat-${Date.now()}`,
        name: trimmed,
        icon: 'gift',
        position: nextCategories.length + 1,
      };
      nextCategories.push(existing);
      writeStorage(STORAGE_KEYS.CATEGORIES, nextCategories);
      memoryCache.categories = nextCategories;
    }
    targetCatId = existing._id;
  }

  const newItem = {
    _id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    categoryId: targetCatId,
    name: itemData.name,
    description: itemData.description || '',
    price: Number(itemData.price) || 0,
    offer: Boolean(itemData.offer),
    offerPrice: itemData.offer && itemData.offerPrice ? Number(itemData.offerPrice) : null,
    variants: Array.isArray(itemData.variants) ? itemData.variants : [],
    available: itemData.available !== undefined ? Boolean(itemData.available) : true,
    image:
      itemData.image ||
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60',
    timing: [],
  };

  const nextItems = [newItem, ...items];
  writeStorage(STORAGE_KEYS.ITEMS, nextItems);
  memoryCache.items = nextItems;
  return newItem;
}

/**
 * Update an existing cake item (price, stock toggle, description, variants)
 */
export async function updateMenuItem(companyId, itemId, updates) {
  const items = readStorage(STORAGE_KEYS.ITEMS, memoryCache.items);
  let updatedItem = null;

  const nextItems = items.map((it) => {
    if (it._id !== itemId) return it;
    updatedItem = { ...it, ...updates };
    return updatedItem;
  });

  writeStorage(STORAGE_KEYS.ITEMS, nextItems);
  memoryCache.items = nextItems;
  return updatedItem;
}

/**
 * Delete a cake item from the menu
 */
export async function deleteMenuItem(companyId, itemId) {
  const items = readStorage(STORAGE_KEYS.ITEMS, memoryCache.items);
  const nextItems = items.filter((it) => it._id !== itemId);

  writeStorage(STORAGE_KEYS.ITEMS, nextItems);
  memoryCache.items = nextItems;
  return { success: true, itemId };
}

/**
 * Create a new category
 */
export async function createCategory(companyId, name) {
  const categories = readStorage(STORAGE_KEYS.CATEGORIES, memoryCache.categories);
  const newCat = {
    _id: `cat-${Date.now()}`,
    name: name.trim(),
    icon: 'gift',
    position: categories.length + 1,
  };

  const nextCategories = [...categories, newCat];
  writeStorage(STORAGE_KEYS.CATEGORIES, nextCategories);
  memoryCache.categories = nextCategories;
  return newCat;
}

/**
 * Reorder categories
 */
export async function reorderCategories(companyId, orderedIds) {
  const categories = readStorage(STORAGE_KEYS.CATEGORIES, memoryCache.categories);
  const idMap = new Map(categories.map((c) => [c._id, c]));

  const nextCategories = orderedIds
    .map((id, index) => {
      const cat = idMap.get(id);
      return cat ? { ...cat, position: index + 1 } : null;
    })
    .filter(Boolean);

  // Preserve any remaining categories not explicitly in orderedIds
  categories.forEach((cat) => {
    if (!orderedIds.includes(cat._id)) {
      nextCategories.push({ ...cat, position: nextCategories.length + 1 });
    }
  });

  writeStorage(STORAGE_KEYS.CATEGORIES, nextCategories);
  memoryCache.categories = nextCategories;
  return nextCategories;
}

/**
 * Reset all persistent store back to default demo data
 */
export function resetToDemoData() {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.COMPANY);
      window.localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      window.localStorage.removeItem(STORAGE_KEYS.ITEMS);
      window.localStorage.removeItem(STORAGE_KEYS.ORDERS);
      window.localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      window.localStorage.removeItem(STORAGE_KEYS.SHOP_OPEN);
    } catch (_) {}
  }
  memoryCache.company = { ...DEFAULT_COMPANY };
  memoryCache.categories = [...INITIAL_CATEGORIES];
  memoryCache.items = [...INITIAL_ITEMS];
  memoryCache.orders = [...INITIAL_ORDERS];
  memoryCache.customers = [...INITIAL_CUSTOMERS];
  memoryCache.shopOpen = true;

  writeStorage(STORAGE_KEYS.COMPANY, memoryCache.company);
  writeStorage(STORAGE_KEYS.CATEGORIES, memoryCache.categories);
  writeStorage(STORAGE_KEYS.ITEMS, memoryCache.items);
  writeStorage(STORAGE_KEYS.ORDERS, memoryCache.orders);
  writeStorage(STORAGE_KEYS.CUSTOMERS, memoryCache.customers);
  writeStorage(STORAGE_KEYS.SHOP_OPEN, true);

  return {
    company: memoryCache.company,
    categories: memoryCache.categories,
    items: memoryCache.items,
    orders: memoryCache.orders,
    customers: memoryCache.customers,
  };
}
