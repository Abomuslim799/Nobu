/**
 * speak.ts — so'zni britancha (London, RP) erkak ovozida o'qish.
 *
 * iPhone'da tayyor britan erkak ovozlari bor: Daniel (doim bor), Arthur, Oliver
 * (Sozlamalar → Accessibility → Spoken Content → Voices → English (UK) dan
 * "Enhanced" sifatlisini yuklab olsangiz — ovoz ancha tabiiy bo'ladi, ilova uni o'zi tanlaydi).
 */

import * as Speech from 'expo-speech';

const MALE_GB = ['arthur', 'daniel', 'oliver', 'malcolm', 'jamie'];
let voice: string | undefined;
let picked = false;

async function pickVoice() {
  if (picked) return voice;
  picked = true;
  try {
    const gb = (await Speech.getAvailableVoicesAsync()).filter((v) => v.language === 'en-GB');
    const score = (v: Speech.Voice) => {
      const name = v.name.toLowerCase();
      const male = MALE_GB.findIndex((n) => name.includes(n));
      return (male >= 0 ? 100 - male : 0) + (v.quality === Speech.VoiceQuality.Enhanced ? 50 : 0);
    };
    voice = gb.sort((a, b) => score(b) - score(a))[0]?.identifier;
  } catch {
    voice = undefined;   // ro'yxat olinmasa — tizimning en-GB ovozi
  }
  return voice;
}

export async function speak(text: string, slow = false) {
  const v = await pickVoice();
  Speech.stop();
  Speech.speak(text, { language: 'en-GB', voice: v, rate: slow ? 0.6 : 0.95, pitch: 1.0 });
}

export function stopSpeaking() {
  Speech.stop();
}
