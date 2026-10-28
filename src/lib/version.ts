/**
 * version.ts — ilova versiyasi. GitHub har yangilanishda o'zi beradi: 1.01, 1.02, ...
 * (.github/workflows/publish.yml → EXPO_PUBLIC_VERSION). Kompyuterda ishga tushirilsa — "dev".
 */
export const VERSION = process.env.EXPO_PUBLIC_VERSION ?? 'dev';
