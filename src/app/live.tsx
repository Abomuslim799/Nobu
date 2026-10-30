/**
 * live.tsx — jonli ovozli suhbat (telefon qo'ng'irog'idek): Gemini Live.
 * Sahifa Railway serverida (web/live.html); ilova uni WebView ichida ochadi va
 * suhbat oxiridagi natijani (ball, xatolar) ko'nikmalar jurnaliga yozadi.
 * Expo Go ovoz oqimini o'zi bajara olmaydi — shuning uchun brauzer (WebView) orqali.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { C, PAD } from '@/constants/theme';
import { logSkill } from '@/lib/skills';
import { getConfig } from '@/lib/sync';
import { Button, T } from '@/ui/kit';

export default function Live() {
  const insets = useSafeAreaInsets();
  const { topic = 'everyday life', words = '', mode = 'english', ctx = '' } = useLocalSearchParams<{ topic: string; words?: string; mode?: string; ctx?: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [noServer, setNoServer] = useState(false);

  useEffect(() => {
    getConfig().then((c) => {
      if (!c) { setNoServer(true); return; }
      const hash = new URLSearchParams({ token: c.token, topic, words, mode, ctx }).toString();
      setUrl(`${c.url}/live.html#${hash}`);
    });
  }, [topic, words, mode, ctx]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold style={{ flex: 1 }}>{mode === 'nobu' ? '📞 Nobu' : '📞 Jonli suhbat'}</T>
        {url && <Pressable onPress={() => Linking.openURL(url)}><T dim size={13}>Safari'da ochish</T></Pressable>}
      </View>
      {noServer ? (
        <View style={{ padding: PAD, gap: 12 }}>
          <T>Server ulanmagan: Statistika → 🔗 Server (widget + AI) bo'limini to'ldiring.</T>
          <Button label="Orqaga" onPress={() => router.back()} />
        </View>
      ) : url ? (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: C.bg }}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          onMessage={(e) => {
            try {
              const m = JSON.parse(e.nativeEvent.data);
              if (m.type === 'live-result' && mode !== 'nobu') logSkill('speaking', m.score, `Jonli · ${m.topic}`, m.mistakes ?? []);
            } catch { /* boshqa xabar */ }
          }}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
});
