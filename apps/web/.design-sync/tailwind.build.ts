import type { Config } from 'tailwindcss';
import base from '../tailwind.config';

// Compiles the design-system CSS: same theme/tokens/plugins as the app, but
// content scanning is narrowed to the UI components and the design-sync
// previews so the emitted stylesheet carries only the classes those use.
const config: Config = {
  ...base,
  content: ['./components/ui/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './.design-sync/previews/**/*.tsx'],
};

export default config;
