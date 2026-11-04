/**
 * host.tsx — Stockfish'ni telefonda yurgizadigan yashirin WebView (Worker ichida, UI qotmaydi).
 * Brauzerda WebView kerak emas — engine.ts o'zi Worker ochadi.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { attachEngine, engineLine, ensureWebEngine } from '@/features/chess/engine/engine';

export function EngineHost() {
  const ref = useRef<{ injectJavaScript: (js: string) => void } | null>(null);   // WebView turi ref bilan mos kelmaydi (kutubxona tiplari)
  const html = useMemo(() => {
    if (Platform.OS === 'web') return '';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SF: string = require('@/features/chess/engine/sf10').default;
    const src = JSON.stringify(SF).replace(/<\//g, '<\\/');
    return `<!doctype html><html><body><script>window.__SF=${src};</script><script>
try {
  var w = new Worker(URL.createObjectURL(new Blob([window.__SF], { type: 'application/javascript' })));
  window.__SF = null;
  w.onmessage = function (e) { window.ReactNativeWebView.postMessage(String(e.data)); };
  window.sf = function (c) { w.postMessage(c); };
  window.ReactNativeWebView.postMessage('__host');
} catch (e) { window.ReactNativeWebView.postMessage('__error ' + e); }
</script></body></html>`;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') { ensureWebEngine(); return; }
    return () => attachEngine(null);
  }, []);
  if (Platform.OS === 'web') return null;
  return (
    <View style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }} pointerEvents="none">
      <WebView ref={ref as never} originWhitelist={['*']} source={{ html, baseUrl: 'https://localhost/' }}
        onMessage={(e) => {
          const d = e.nativeEvent.data;
          if (d === '__host') attachEngine((c) => ref.current?.injectJavaScript(`window.sf(${JSON.stringify(c)});true;`));
          else engineLine(d);
        }} />
    </View>
  );
}
