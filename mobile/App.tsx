import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const APP_URL = 'https://magicbus91.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      webViewRef.current?.injectJavaScript(
        `window.__nativeLocation = ${JSON.stringify(loc)}; true;`
      );
    })();
  }, []);

  const handleLoad = useCallback(() => {
    if (location) {
      webViewRef.current?.injectJavaScript(
        `window.__nativeLocation = ${JSON.stringify(location)}; true;`
      );
    }
  }, [location]);

  const handleNavigationState = useCallback((navState: any) => {
    if (navState.url && !navState.url.startsWith(APP_URL)) return false;
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#F05510" />
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        geolocationEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        onLoad={handleLoad}
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
