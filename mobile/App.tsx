import { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const APP_URL = 'https://magicbus91.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const injectedRef = useRef(false);

  const doInject = useCallback((loc: { lat: number; lng: number }) => {
    if (injectedRef.current) return;
    webViewRef.current?.injectJavaScript(
      `window.__nativeLocation = ${JSON.stringify(loc)}; true;`
    );
    injectedRef.current = true;
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locationRef.current = loc;
      doInject(loc);
    })();
  }, [doInject]);

  const handleLoadEnd = useCallback(() => {
    if (locationRef.current) {
      doInject(locationRef.current);
    } else {
      webViewRef.current?.injectJavaScript(
        `console.log('[MagicBus] Esperando ubicación nativa...'); true;`
      );
    }
  }, [doInject]);

  const handleNavigationState = useCallback((navState: any) => {
    return !(navState.url && !navState.url.startsWith(APP_URL));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#F05510" />
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F05510',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
