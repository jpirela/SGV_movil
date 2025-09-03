// useExpoHostIp.js
import { useMemo } from 'react';
import Constants from 'expo-constants';

export function useExpoHostIp(port = 8080, path = '/api') {
  return useMemo(() => {
    const hostUri = Constants.expoConfig?.hostUri || '';
    if (!hostUri) return null;

    // hostUri suele verse como "192.168.0.10:19000"
    const ip = hostUri.split(':')[0];
    if (!ip) return null;

    return {
      ip,
      apiUrl: `http://${ip}:${port}${path}`,
    };
  }, [port, path]);
}
