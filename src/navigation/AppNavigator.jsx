// src/navigation/AppNavigator.jsx
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';

import { OrdersScreen } from '../screens/OrdersScreen';
import { MenuManagementScreen } from '../screens/MenuManagementScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const { stats } = useApp();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Orders') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'Menu') {
              iconName = focused ? 'gift' : 'gift-outline';
            } else if (route.name === 'Analytics') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'people' : 'people-outline';
            }

            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            tabBarLabel: 'Live Orders',
            tabBarBadge: stats.pendingCount > 0 ? stats.pendingCount : undefined,
            tabBarBadgeStyle: styles.badgeStyle,
          }}
        />

        <Tab.Screen
          name="Menu"
          component={MenuManagementScreen}
          options={{
            tabBarLabel: 'Cake Menu',
          }}
        />

        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarLabel: 'Analytics',
          }}
        />

        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History & CRM',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    height: Platform.OS === 'ios' ? 86 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...SHADOWS.md,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 2,
  },
  badgeStyle: {
    backgroundColor: COLORS.accent,
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
  },
});
