import React, { useCallback, useMemo } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const DEFAULT_WEB_APP_URL = 'https://puzl.vercel.app';

export default function App() {
  const webAppUrl = useMemo(
    () => process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() || DEFAULT_WEB_APP_URL,
    []
  );

  const handleOpenWebApp = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(webAppUrl);
      if (supported) {
        await Linking.openURL(webAppUrl);
      }
    } catch (error) {
      console.warn('Unable to open web experience', error);
    }
  }, [webAppUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Puzl</Text>
        <Text style={styles.body}>
          The Puzl mobile build now ships with a lightweight shell. Tap the button below to open the
          full puzzle experience in your browser. Set EXPO_PUBLIC_WEB_APP_URL if you want to point to
          a different deployment during development.
        </Text>
        <Pressable onPress={handleOpenWebApp} style={styles.button}>
          <Text style={styles.buttonText}>Open Puzl</Text>
        </Pressable>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Destination: {webAppUrl}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827'
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151'
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14
  }
});
