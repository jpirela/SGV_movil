import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'url_base';

/**
 * Normaliza la URL eliminando barra final y asegurando http/https
 */
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let base = url.trim();
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'http://' + base;
  }
  // eliminar barra final
  base = base.replace(/\/$/, '');
  return base;
};

/**
 * Verifica si la URL es válida probando un endpoint real (/clientes)
 * @param {string} url - Dirección base de la API (puede incluir /api al final)
 * @returns {Promise<boolean>}
 */
export const validateApiUrl = async (url) => {
  try {
    const normalized = normalizeUrl(url);
    const testUrl = `${normalized}/clientes`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Guarda la URL base de la API después de validarla
 * @param {string} url - Dirección base de la API
 * @returns {Promise<string>} - Retorna la URL normalizada y válida
 */
export const setApiBaseUrl = async (url) => {
  const normalized = normalizeUrl(url);
  const isValid = await validateApiUrl(normalized);
  if (!isValid) {
    throw new Error(`No se pudo validar la URL de la API. Verifica que el servidor esté activo: ${normalized}`);
  }
  await AsyncStorage.setItem(STORAGE_KEY, normalized);
  return normalized;
};

/**
 * Obtiene la URL base de la API desde almacenamiento
 * @returns {Promise<string|null>}
 */
export const getApiBaseUrl = async () => {
  return await AsyncStorage.getItem(STORAGE_KEY);
};

/**
 * Devuelve la URL base o un valor por defecto si no existe
 * @param {string} defaultUrl - URL que se usará si no hay nada guardado
 * @returns {Promise<string>}
 */
export const getApiBaseUrlOrDefault = async (defaultUrl) => {
  const url = await AsyncStorage.getItem(STORAGE_KEY);
  return url || normalizeUrl(defaultUrl);
};

/**
 * Elimina la URL base guardada (para reset)
 */
export const clearApiBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
