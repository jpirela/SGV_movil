import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = 'url_base';

// ⚡ Valor por defecto tomado de app.config.js → extra.URL_BASE
 export const DEFAULT_URL_BASE = Constants.expoConfig?.extra?.URL_BASE;

/**
 * Normaliza la URL eliminando barra final y asegurando http/https
 */
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let base = url.trim();
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'http://' + base;
  }
  return base.replace(/\/$/, ''); // eliminar barra final
};

/**
 * Verifica si la URL es válida probando un endpoint real (/clientes)
 */
export const validateApiUrl = async (url) => {
  try {
    const testUrl = `${url}/clientes`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Guarda la URL base de la API después de validarla
 */
export const setApiBaseUrl = async (url) => {
  const normalized = normalizeUrl(url);
  const isValid = await validateApiUrl(normalized);
  if (!isValid) {
    throw new Error(
      `No se pudo validar la URL de la API. Verifica que el servidor esté activo: ${normalized}`
    );
  }
  await AsyncStorage.setItem(STORAGE_KEY, normalized);
  return normalized;
};

/**
 * Obtiene la URL base de la API desde almacenamiento
 */
export const getApiBaseUrl = async () => {
  return await AsyncStorage.getItem(STORAGE_KEY);
};

/**
 * Devuelve la URL base o un valor por defecto (de app.config.js)
 */
export const getApiBaseUrlOrDefault = async () => {
  const url = await AsyncStorage.getItem(STORAGE_KEY);
  return url || normalizeUrl(DEFAULT_URL_BASE);
};

/**
 * Elimina la URL base guardada (para reset)
 */
export const clearApiBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

// Configuración de usuarios locales
let AUTH_CONFIG = {
  user: { user: "user", password: "123456" },
  admin: { user: "admin", password: "admin1234" }
};

export const getAuthConfig = () => AUTH_CONFIG;
