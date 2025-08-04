import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

const { URL_BASE, MODELOS: MODELOS_NOMBRES } = Constants.expoConfig.extra;
const DATA_DIR = FileSystem.documentDirectory + 'data/';

// Construimos un objeto con nombre de modelo -> ruta local
const MODELOS = {};
MODELOS_NOMBRES.forEach((modelo) => {
  MODELOS[modelo] = `${DATA_DIR}${modelo}.json`;
});

/**
 * Asegura que el directorio de datos exista
 */
const asegurarDataDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DATA_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
  }
};

/**
 * Devuelve el nombre del modelo y su ruta de archivo
 */
const getModeloPathPairs = () => {
  return Object.entries(MODELOS).map(([modelo, filePath]) => ({
    modelo,
    filePath,
  }));
};

const RESPUESTAS_PATH = `${DATA_DIR}Respuestas.json`;

/**
 * Guarda respuestas en Respuestas.json
 */
export const guardarRespuestas = async (idCliente, respuestas) => {
  try {
    await asegurarDataDir();
    const respuestasInfo = await FileSystem.getInfoAsync(RESPUESTAS_PATH);
    let respuestasData = {};
    if (respuestasInfo.exists) {
      const contenido = await FileSystem.readAsStringAsync(RESPUESTAS_PATH);
      respuestasData = JSON.parse(contenido);
    }
    respuestasData[idCliente] = respuestas;
    const json = JSON.stringify(respuestasData, null, 2);
    await FileSystem.writeAsStringAsync(RESPUESTAS_PATH, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    console.log(`✅ Respuestas guardadas para el cliente ${idCliente}`);
  } catch (error) {
    console.warn(`❌ Error al guardar respuestas: ${error.message}`);
    throw error;
  }
};

/**
 * Sincroniza un modelo: descarga desde API o crea archivo vacío si no hay datos
 */
export const syncModeloFS = async (modelo, filePath) => {
  const url = `${URL_BASE}/${modelo}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Estado HTTP ${response.status}`);

    const data = await response.json();
    const json = JSON.stringify(data ?? [], null, 2);

    await FileSystem.writeAsStringAsync(filePath, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`✅ ${modelo}.json actualizado correctamente (${Array.isArray(data) ? data.length : 0} registros)`);
  } catch (error) {
    console.warn(`⚠️ Error al sincronizar ${modelo}: ${error.message}`);
    const archivoExiste = await FileSystem.getInfoAsync(filePath);
    if (!archivoExiste.exists) {
      await FileSystem.writeAsStringAsync(filePath, '[]', {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log(`📄 ${modelo}.json creado vacío por primera vez`);
    }
  }
};

/**
 * Lista de modelos que NO deben sincronizarse con la API
 * (solo usan datos locales)
 */
const MODELOS_SOLO_LOCALES = ['clientes'];

/**
 * Sincroniza todos los modelos si hay conexión
 */
export const syncTodosLosModelosFS = async () => {
  try {
    await asegurarDataDir();

    const netInfo = await NetInfo.fetch();
    const conectado = netInfo.isConnected;

    for (const { modelo, filePath } of getModeloPathPairs()) {
      // Si el modelo está marcado como solo local, no sincronizar con API
      if (MODELOS_SOLO_LOCALES.includes(modelo)) {
        const archivoExiste = await FileSystem.getInfoAsync(filePath);
        if (!archivoExiste.exists) {
          await FileSystem.writeAsStringAsync(filePath, '[]', {
            encoding: FileSystem.EncodingType.UTF8,
          });
          console.log(`📱 ${modelo}.json creado vacío (solo local, no sincroniza con API)`);
        } else {
          console.log(`📱 ${modelo}.json existe localmente (no sincroniza con API)`);
        }
        continue;
      }

      if (conectado) {
        console.log(`🌐 Sincronizando ${modelo} desde la API...`);
        await syncModeloFS(modelo, filePath);
      } else {
        const archivoExiste = await FileSystem.getInfoAsync(filePath);
        if (!archivoExiste.exists) {
          await FileSystem.writeAsStringAsync(filePath, '[]', {
            encoding: FileSystem.EncodingType.UTF8,
          });
          console.log(`📁 ${modelo}.json creado vacío sin conexión`);
        } else {
          console.log(`📄 ${modelo}.json ya existe, no se modifica`);
        }
      }
    }
  } catch (error) {
    console.warn('❌ Error al sincronizar modelos:', error.message);
  }
};

/**
 * Lee un archivo local con los datos del modelo
 */
export const leerModeloFS = async (modelo) => {
  const filePath = MODELOS[modelo];
  
  if (!filePath) {
    console.warn(`❌ Modelo '${modelo}' no está configurado en MODELOS`);
    return [];
  }
  
  try {
    const archivoExiste = await FileSystem.getInfoAsync(filePath);
    if (!archivoExiste.exists) {
      console.warn(`📄 Archivo ${modelo}.json no encontrado en: ${filePath}`);
      return [];
    }
    
    const contenido = await FileSystem.readAsStringAsync(filePath);
    
    if (!contenido || contenido.trim() === '') {
      console.warn(`📄 Archivo ${modelo}.json está vacío`);
      return [];
    }
    
    const datos = JSON.parse(contenido);
    console.log(`✅ ${modelo}.json leído correctamente - ${Array.isArray(datos) ? datos.length : 'N/A'} registros`);
    
    return datos;
  } catch (err) {
    console.warn(`❌ Error al leer ${modelo}.json:`, err.message);
    return [];
  }
};

/**
 * Lee específicamente los clientes locales (garantiza que no use API)
 */
export const leerClientesLocales = async () => {
  console.log('📱 Leyendo clientes desde almacenamiento local únicamente...');
  return await leerModeloFS('clientes');
};

/**
 * Guarda un nuevo cliente en el almacenamiento local y retorna el idCliente generado
 */
export const guardarNuevoCliente = async (clienteData) => {
  const filePath = MODELOS['clientes'];
  
  if (!filePath) {
    throw new Error('Modelo clientes no está configurado');
  }
  
  try {
    await asegurarDataDir();
    
    // Leer clientes existentes
    const clientesExistentes = await leerClientesLocales();
    
    // Generar nuevo idCliente secuencial
    const maxId = clientesExistentes.reduce((max, cliente) => {
      const id = parseInt(cliente.idCliente) || 0;
      return id > max ? id : max;
    }, 0);
    const nuevoIdCliente = maxId + 1;
    
    // Crear nuevo cliente con idCliente
    const nuevoCliente = {
      idCliente: nuevoIdCliente.toString(),
      fechaCreacion: new Date().toISOString(),
      ...clienteData
    };
    
    // Agregar a la lista
    const clientesActualizados = [...clientesExistentes, nuevoCliente];
    
    const json = JSON.stringify(clientesActualizados, null, 2);
    
    await FileSystem.writeAsStringAsync(filePath, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log(`✅ Cliente guardado con ID: ${nuevoIdCliente}`);
    return nuevoIdCliente.toString();
  } catch (error) {
    console.warn(`❌ Error al guardar cliente: ${error.message}`);
    throw error;
  }
};

/**
 * Guarda datos de clientes en el almacenamiento local (función original para compatibilidad)
 */
/**
 * Elimina las respuestas de un cliente específico por su idCliente
 */
export const eliminarRespuestasCliente = async (idCliente) => {
  const filePath = RESPUESTAS_PATH;

  try {
    await asegurarDataDir();
    const respuestasInfo = await FileSystem.getInfoAsync(filePath);
    if (!respuestasInfo.exists) {
      console.log('📄 No se encontró el archivo de respuestas');
      return;
    }

    const contenido = await FileSystem.readAsStringAsync(filePath);
    let respuestasData = JSON.parse(contenido);

    // Verificar si existen respuestas para este cliente
    if (respuestasData[idCliente]) {
      delete respuestasData[idCliente];
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(respuestasData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log(`✅ Respuestas del cliente ${idCliente} eliminadas correctamente`);
    } else {
      console.log(`ℹ️ No se encontraron respuestas para el cliente ${idCliente}`);
    }
  } catch (error) {
    console.warn(`❌ Error al eliminar respuestas del cliente ${idCliente}:`, error.message);
    throw error;
  }
};

export const guardarClientesLocales = async (clientes) => {
  const filePath = MODELOS['clientes'];
  
  if (!filePath) {
    throw new Error('Modelo clientes no está configurado');
  }
  
  try {
    await asegurarDataDir();
    const json = JSON.stringify(clientes || [], null, 2);
    
    await FileSystem.writeAsStringAsync(filePath, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log(`✅ Clientes guardados localmente (${Array.isArray(clientes) ? clientes.length : 0} registros)`);
    return true;
  } catch (error) {
    console.warn(`❌ Error al guardar clientes localmente: ${error.message}`);
    throw error;
  }
};
