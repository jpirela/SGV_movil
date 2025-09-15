// utils/dataCache.js
// Sistema de cache global para evitar lecturas múltiples de los mismos datos

let globalCache = {
  categorias: [],
  preguntas: [],
  formasPago: [],
  condicionesPago: [],
  estados: [],
  municipios: [],
  parroquias: [],
  ciudades: [],
  loaded: false,
  loading: false
};

// Event listeners para notificar cuando los datos estén listos
const listeners = new Set();

/**
 * Registra un callback que se ejecutará cuando los datos estén cargados
 */
export const onDataReady = (callback) => {
  if (globalCache.loaded) {
    // Si ya están cargados, ejecutar inmediatamente
    callback(globalCache);
  } else {
    // Si no, agregar a la lista de espera
    listeners.add(callback);
  }
  
  // Devolver función para desregistrar
  return () => listeners.delete(callback);
};

/**
 * Notifica a todos los listeners que los datos están listos
 */
const notifyListeners = () => {
  listeners.forEach(callback => {
    try {
      callback(globalCache);
    } catch (error) {
      console.warn('Error en listener de cache:', error);
    }
  });
  listeners.clear();
};

/**
 * Carga todos los datos maestros en el cache desde datos ya leídos
 * Versión optimizada que evita lecturas innecesarias
 */
export const loadMasterDataFromSync = async (datosYaLeidos) => {
  if (globalCache.loading || globalCache.loaded) {
    return globalCache;
  }

  globalCache.loading = true;
  
  try {
    console.log('🔄 Cargando datos maestros en cache desde sincronización...');
    
    // Usar datos ya leídos directamente (sin leer archivos otra vez)
    globalCache.categorias = datosYaLeidos.categorias || [];
    globalCache.preguntas = datosYaLeidos.preguntas || [];
    globalCache.formasPago = datosYaLeidos['formas-pago'] || [];
    globalCache.condicionesPago = datosYaLeidos['condiciones-pago'] || [];
    globalCache.estados = datosYaLeidos.estados || [];
    globalCache.municipios = datosYaLeidos.municipios || [];
    globalCache.parroquias = datosYaLeidos.parroquias || [];
    globalCache.ciudades = datosYaLeidos.ciudades || [];

    globalCache.loaded = true;
    globalCache.loading = false;

    console.log('✅ Cache de datos maestros cargado (OPTIMIZADO):', {
      categorias: globalCache.categorias.length,
      preguntas: globalCache.preguntas.length,
      formasPago: globalCache.formasPago.length,
      condicionesPago: globalCache.condicionesPago.length,
      estados: globalCache.estados.length,
      ciudades: globalCache.ciudades.length
    });

    // Notificar a todos los listeners
    notifyListeners();

  } catch (error) {
    console.warn('❌ Error cargando datos maestros:', error);
    globalCache.loading = false;
    throw error;
  }

  return globalCache;
};

/**
 * Carga todos los datos maestros en el cache (versión original - FALLBACK)
 * Esta función debe ser llamada una sola vez desde el SplashScreen
 */
export const loadMasterData = async (leerModeloFS) => {
  if (globalCache.loading || globalCache.loaded) {
    return globalCache;
  }

  globalCache.loading = true;
  
  try {
    console.log('🔄 Cargando datos maestros en cache...');
    
    const [
      categoriasData,
      preguntasData,
      formasPagoData,
      condicionesPagoData,
      estadosData,
      municipiosData,
      parroquiasData,
      ciudadesData,
    ] = await Promise.all([
      leerModeloFS('categorias'),
      leerModeloFS('preguntas'),
      leerModeloFS('formas-pago'),
      leerModeloFS('condiciones-pago'),
      leerModeloFS('estados'),
      leerModeloFS('municipios'),
      leerModeloFS('parroquias'),
      leerModeloFS('ciudades'),
    ]);

    // Normalizar datos (manejar tanto arrays como objetos con rows)
    globalCache.categorias = Array.isArray(categoriasData) ? categoriasData : (categoriasData?.rows ?? []);
    globalCache.preguntas = Array.isArray(preguntasData) ? preguntasData : (preguntasData?.rows ?? []);
    globalCache.formasPago = Array.isArray(formasPagoData) ? formasPagoData : (formasPagoData?.rows ?? []);
    globalCache.condicionesPago = Array.isArray(condicionesPagoData) ? condicionesPagoData : (condicionesPagoData?.rows ?? []);
    globalCache.estados = Array.isArray(estadosData) ? estadosData : (estadosData?.rows ?? []);
    globalCache.municipios = Array.isArray(municipiosData) ? municipiosData : (municipiosData?.rows ?? []);
    globalCache.parroquias = Array.isArray(parroquiasData) ? parroquiasData : (parroquiasData?.rows ?? []);
    globalCache.ciudades = Array.isArray(ciudadesData) ? ciudadesData : (ciudadesData?.rows ?? []);

    globalCache.loaded = true;
    globalCache.loading = false;

    console.log('✅ Cache de datos maestros cargado:', {
      categorias: globalCache.categorias.length,
      preguntas: globalCache.preguntas.length,
      formasPago: globalCache.formasPago.length,
      condicionesPago: globalCache.condicionesPago.length,
      estados: globalCache.estados.length,
      ciudades: globalCache.ciudades.length
    });

    // Notificar a todos los listeners
    notifyListeners();

  } catch (error) {
    console.warn('❌ Error cargando datos maestros:', error);
    globalCache.loading = false;
    throw error;
  }

  return globalCache;
};

/**
 * Obtiene los datos del cache (debe ser usado después de loadMasterData)
 */
export const getMasterData = () => {
  if (!globalCache.loaded) {
    console.warn('⚠️ Intentando obtener datos del cache antes de cargarlos');
  }
  return globalCache;
};

/**
 * Verifica si los datos están cargados
 */
export const isDataLoaded = () => globalCache.loaded;

/**
 * Limpia el cache (útil para testing o reset)
 */
export const clearCache = () => {
  globalCache = {
    categorias: [],
    preguntas: [],
    formasPago: [],
    condicionesPago: [],
    estados: [],
    municipios: [],
    parroquias: [],
    ciudades: [],
    loaded: false,
    loading: false
  };
  listeners.clear();
};