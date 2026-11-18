# Lavino Cake Studio — Standalone Frontend Web & Mobile App

A standalone, completely working React Native & Web application for cake studio kitchen staff, order management, menu customization, and sales analytics.

> **100% Frontend-Only & Standalone**: This application operates completely client-side with zero external backend or database dependencies. All data (orders, menu items, categories, customers, and business status) persists automatically in your browser via `window.localStorage`.

---

## 🌟 Features

1. **Live Kitchen Orders (`Live Orders` Tab)**
   - Continuous sequential order numbering (`#101`, `#102`, etc.).
   - Order progression workflow: **Pending** ➔ **Cooking** ➔ **Ready** ➔ **Delivered**.
   - Revert order status backwards or cancel with reason.
   - Real-time search by Order #, Customer Name, Phone Number, or Table.
   - Status filter tabs with dynamic count badges: *All*, *Pending*, *Cooking*, *Ready*, *Delivered*.
   - **Order Detail Bottom Sheet**: Itemized summary, customer phone calling, cake custom message/notes banner, preparation duration, and bill breakdown.
   - **`+ Test Order` button**: Instantly simulate incoming customer orders.
   - **`New Order` modal**: Staff order entry with calendar date picker (*Today*, *Tomorrow*, *Custom Date*), time picker (*ASAP* or custom AM/PM time stepper), cake catalog selection, weight variants, quantity stepper, and custom notes.

2. **Cake Menu Management (`Cake Menu` Tab)**
   - Category filtering & sequential position sorting.
   - Stock availability toggle: easily mark items **In Stock** or **Out of Stock**.
   - **Add & Edit Cake Modal**:
     - Name, Category dropdown, Description, Base Price, and Discount Offers.
     - Weight variants with custom pricing (e.g., 500g, 1kg, 2kg, custom).
     - Image preview with support for gallery upload, camera, or image URL.
   - Category reordering modal with drag/move controls.
   - Delete cake items with automatic category cleanup.

3. **Analytics & Sales Dashboard (`Analytics` Tab)**
   - Real-time today's revenue, active order count, Average Order Value (AOV), and average kitchen prep time.
   - Peak order hours bar chart.
   - Best-selling cakes leaderboard with percentage shares.
   - Category revenue breakdown.

4. **Order History & CRM (`History & CRM` Tab)**
   - Past orders log filtered by Delivered or Cancelled.
   - Customer CRM database: customer phone, order frequency, total lifetime spend, and favorite items.

5. **Desktop & Mobile Responsive Shell**
   - **Desktop View**: Displayed in a phone mockup frame with subtle shadow and background.
   - **View Toggle**: Click **Wide** / **Mobile** in the header to switch between mobile mockup and full-width layout.
   - **Mobile Devices**: Naturally expands to 100% full-screen responsive layout.
   - **Reset Demo Data**: Convenient button in header to restore initial cake catalog and orders anytime.
   - **Multi-Tab Sync**: Multiple open browser tabs synchronize state changes in real time.

---

## 🚀 How to Run

### 1. Run the Pre-Built Static Website (Zero build step needed)

The static website is pre-compiled and ready in the `dist/` directory:

```bash
# Using npx serve (recommended)
npx serve dist -l 3000

# OR using Python's built-in HTTP server
python3 -m http.server 3000 -d dist
```

Then open your browser at **`http://localhost:3000`**.

---

### 2. Run the Development Server (with Live Hot-Reloading)

```bash
# Launch the Expo Web development server
npm run web

# OR start interactive Expo CLI (Web, Android, iOS)
npm start
```

Press **`w`** in the terminal to open the app in your default browser.

---

### 3. Rebuild the Static Website

To re-bundle the static website whenever you make source code modifications:

```bash
npm run build
```

This exports all static HTML, CSS, JavaScript, and font assets into the `dist/` folder.

---

## 📁 Directory Structure

```text
react_app/
├── App.js                     # Main entry wrapper with responsive web shell
├── app.json                   # Expo configuration & web metadata
├── index.js                   # Application root register
├── package.json               # Scripts and dependencies
├── dist/                      # 100% Standalone pre-built static website
│   ├── index.html             # Static web entry point
│   ├── favicon.ico            # Favicon
│   ├── metadata.json          # Web bundle manifest
│   └── _expo/                 # Bundled static JS and vector font assets
└── src/
    ├── components/
    │   ├── CreateOrderModal.jsx   # Manual in-store/phone order creation modal
    │   ├── Header.jsx             # Top branding, standalone badge & action controls
    │   ├── ItemFormModal.jsx      # Add/edit cake item with image picker & variants
    │   ├── OrderCard.jsx          # Interactive live kitchen order card
    │   ├── OrderDetailModal.jsx   # Full order details, call customer, revert/cancel
    │   ├── PhoneNotch.jsx         # Physical safe area spacing
    │   └── StatusBadge.jsx        # Order status badge (Pending, Cooking, Ready, etc.)
    ├── context/
    │   └── AppContext.js          # Global app state, real-time sync & computed stats
    ├── data/
    │   └── initialData.js         # Initial mock categories, cake items & orders
    ├── navigation/
    │   └── AppNavigator.jsx       # Bottom tab navigator with badges
    ├── screens/
    │   ├── AnalyticsScreen.jsx        # Sales analytics & peak hours charts
    │   ├── HistoryScreen.jsx          # Order history & Customer CRM
    │   ├── MenuManagementScreen.jsx   # Cake catalog management & category reorder
    │   └── OrdersScreen.jsx           # Live kitchen orders dashboard
    ├── services/
    │   └── api.js                 # Standalone persistent client storage layer
    └── theme/
        └── colors.js              # Bakery warm palette & elevation styles
```

---

## 💾 Data Persistence Details

All edits and modifications are persisted in `localStorage` under keys prefixed with `lavino_standalone_*`:
- `lavino_standalone_orders_v2`
- `lavino_standalone_items_v2`
- `lavino_standalone_categories_v2`
- `lavino_standalone_customers_v2`
- `lavino_standalone_company_v2`

To reset back to initial demo data at any time, simply click the **"Reset Demo"** button in the top navigation header.
# new-one
