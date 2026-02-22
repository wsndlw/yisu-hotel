if (typeof (globalThis as any).FinalizationRegistry === 'undefined') {
  (globalThis as any).FinalizationRegistry = class {
    register() {
      // 占位函数，防止 Apollo 检查时崩溃
    }
    unregister() {
      // 占位函数
    }
  };
}
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
