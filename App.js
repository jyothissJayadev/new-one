// App.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

const AppShell = () => {
  const { webLayoutMode } = useApp();
  const isWeb = Platform.OS === 'web';
  const isMobileFrame = isWeb && webLayoutMode === 'mobile';

  return (
    <View style={[styles.root, isMobileFrame && styles.rootFramed]}>
      <View
        style={[
          styles.appContainer,
          isMobileFrame && styles.appFramedContainer,
        ]}
      >
        <StatusBar style="dark" />
        <AppNavigator />
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF7F2',
  },
  rootFramed: {
    backgroundColor: '#1E1611', // Deep bakery roast background for desktop presentation
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF7F2',
  },
  appFramedContainer: {
    maxWidth: 480,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF7F2',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#3D2F24',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      : {}),
  },
});
