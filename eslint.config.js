// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'node_modules/*', 'src/features/chess/engine/sf10.ts'] },
  {
    rules: {
      'react/no-unescaped-entities': 'off',       // React Native — HTML emas; o'zbekcha apostrof (o'z, g'oya) xato emas
      'react-hooks/exhaustive-deps': 'off',
      // React Compiler qoidalari: hozircha ogohlantirish (kompilyator bunday komponentni optimallashtirmaydi, lekin ishlaydi)
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
