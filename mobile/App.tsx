import { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, BackHandler } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const APP_URL = 'https://magicbus91.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);

  const respond = useCallback((requestId: string, payload: object) => {
    const json = JSON.stringify({ requestId, ...payload });
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('nativeLocationResponse', { detail: ${json} })); true;`
    );
  }, []);

  const handleLocationRequest = useCallback(
    async (requestId: string) => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          respond(requestId, { ok: false, error: 'permission_denied' });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        respond(requestId, {
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      } catch (err: any) {
        respond(requestId, { ok: false, error: String(err?.message ?? err) });
      }
    },
    [respond]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg?.type === 'REQUEST_LOCATION' && typeof msg.requestId === 'string') {
          handleLocationRequest(msg.requestId);
        }
      } catch {
      }
    },
    [handleLocationRequest]
  );

  const handleLoadEnd = useCallback(() => {
    webViewRef.current?.injectJavaScript(`window.__isNativeApp = true; true;`);
  }, []);

  const handleNavigationState = useCallback((navState: any) => {
    return !(navState.url && !navState.url.startsWith(APP_URL));
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      webViewRef.current?.goBack();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
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
        geolocationEnabled
        onMessage={handleMessage}
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
