import { useRef, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const APP_URL = 'https://magicbus91.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type !== 'GET_LOCATION') return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        webViewRef.current?.injectJavaScript(
          `window.__handleLocationError("Permiso denegado"); true;`
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      webViewRef.current?.injectJavaScript(
        `window.__handleLocation(${JSON.stringify(loc)}); true;`
      );
    } catch {
      webViewRef.current?.injectJavaScript(
        `window.__handleLocationError("Error al obtener ubicación"); true;`
      );
    }
  }, []);

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
        onMessage={handleMessage}
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
