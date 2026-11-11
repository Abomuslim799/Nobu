// Node (GitHub Actions) uchun: engine.ts faqat Platform.OS ni so'raydi.
export const Platform = { OS: 'node', select: <T,>(o: { default?: T }) => o.default };
