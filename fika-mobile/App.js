import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

export default function App() {
  const webView = useRef(null);
  const [failed, setFailed] = useState(false);
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  const url = process.env.EXPO_PUBLIC_FIKA_URL || `http://${host || '172.20.10.2'}:5188/`;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <WebView ref={webView} style={styles.web} source={{ uri: url }}
          javaScriptEnabled domStorageEnabled sharedCookiesEnabled setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={`
            if (window.crypto && !window.crypto.randomUUID) {
              window.crypto.randomUUID = function () {
                var bytes = new Uint8Array(16);
                window.crypto.getRandomValues(bytes);
                bytes[6] = (bytes[6] & 15) | 64;
                bytes[8] = (bytes[8] & 63) | 128;
                var hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); });
                return hex.slice(0,4).join('') + '-' + hex.slice(4,6).join('') + '-' + hex.slice(6,8).join('') + '-' + hex.slice(8,10).join('') + '-' + hex.slice(10).join('');
              };
            }
            true;
          `}
          contentInsetAdjustmentBehavior="never" startInLoadingState
          renderLoading={() => <View style={styles.loading}><ActivityIndicator color="#268c42" size="large" /></View>}
          onError={() => setFailed(true)} onLoad={() => setFailed(false)} />
        {failed && <View style={styles.error}>
          <Text style={styles.title}>Fika is not reachable</Text>
          <Text style={styles.copy}>Keep your computer connected to your iPhone hotspot and leave Fika Mobile running on the computer.</Text>
          <Text selectable style={styles.address}>{url}</Text>
          <Pressable style={styles.button} onPress={() => { setFailed(false); webView.current?.reload(); }}><Text style={styles.buttonText}>Try again</Text></Pressable>
        </View>}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  error: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f6f8f5', padding: 28, justifyContent: 'center', gap: 18 },
  title: { fontSize: 26, fontWeight: '700', color: '#1e3525' },
  copy: { fontSize: 16, lineHeight: 24, color: '#52665a' },
  address: { fontSize: 14, color: '#52665a' },
  button: { padding: 16, borderRadius: 14, backgroundColor: '#268c42', alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
