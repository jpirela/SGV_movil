import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'url_base';

/**
 * Verifica si la URL es válida probando un endpoint real (/clientes)
 * @param {string} url - Dirección base de la API (puede incluir /api al final)
 * @returns {Promise<boolean>}
 */
export const validateApiUrl = async (url) => {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    // Asegurar que no haya doble slash
    const testUrl = url.endsWith('/') ? `${url}clientes` : `${url}/clientes`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    return response.ok; // true si el código HTTP es 200-299
  } catch (error) {
    return false;
  }
};

/**
 * Guarda la URL base de la API después de validarla
 * @param {string} url - Dirección base de la API (con http o https)
 */
export const setApiBaseUrl = async (url) => {
  const isValid = await validateApiUrl(url);
  if (!isValid) {
    throw new Error('No se pudo validar la URL de la API. Verifica que el servidor esté activo.');
  }
  await AsyncStorage.setItem(STORAGE_KEY, url);
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
  return url || defaultUrl;
};

/**
 * Elimina la URL base guardada (para reset)
 */
export const clearApiBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
