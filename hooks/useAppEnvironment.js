// useAppEnvironment.js
import Constants from 'expo-constants';

export function useAppEnvironment() {
  const isExpo = Constants.appOwnership === 'expo';
  const isStandalone = Constants.appOwnership === 'standalone';

  return {
    isExpo,
    isStandalone,
    environment: isExpo ? 'expo' : 'apk'
  };
}
