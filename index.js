import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';

// Bootstrap: enable/disable console based on MODE from app.config.js
(() => {
  const mode = Constants?.expoConfig?.extra?.MODE ?? 'development';

  if (mode === 'production') {
    // Disable debug-level logs in production
    // Keep warnings and errors visible
    // eslint-disable-next-line no-console
    console.log = () => {};
    // eslint-disable-next-line no-console
    console.debug = () => {};
    // eslint-disable-next-line no-console
    console.info = () => {};
  } else {
    // In development, ensure console methods exist (safety on some platforms)
    // eslint-disable-next-line no-console
    console.log = console.log || function () {};
    // eslint-disable-next-line no-console
    console.debug = console.debug || function () {};
    // eslint-disable-next-line no-console
    console.info = console.info || function () {};
  }
})();

// Import App after console bootstrap to ensure settings apply to all modules
// Using require to avoid hoisting so the bootstrap runs first
// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

export default App;
