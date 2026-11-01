/**
 * mic — mikrofon bilan yozish (Speaking va talaffuz mashqlari).
 */

import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { useState } from 'react';
import { Alert } from 'react-native';

import { stopSpeaking } from '@/core/audio/speak';


/** Mikrofon bilan yozish: bitta yozuvchi, qaysi narsa yozilayotgani `tag` bilan belgilanadi. */
export function useMic() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [tag, setTag] = useState<string | null>(null);
  const start = async (t: string) => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { Alert.alert('Mikrofon', 'Sozlamalar → Expo Go → Mikrofon ruxsatini yoqing.'); return; }
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setTag(t);
  };
  /** To'xtatadi va yozuv faylini qaytaradi. */
  const stop = async (): Promise<string | null> => {
    await recorder.stop();
    // Yozib bo'lgach — ovoz yana karnaydan chiqsin (iOS yozish rejimida qulog'i yonidagi dinamikka o'tadi).
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setTag(null);
    return recorder.uri ?? null;
  };
  return { tag, start, stop };
}
