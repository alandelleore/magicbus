import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';

const APP_URL = 'https://magicbus91.vercel.app';

export default function App() {
  const handleNavigationState = useCallback((navState: any) => {
    if (navState.url && !navState.url.startsWith(APP_URL)) {
      return false;
    }
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#F05510" />
      <WebView
        source={{ uri: APP_URL }}
        style={styles.webview}
        geolocationEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
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
