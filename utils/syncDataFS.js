import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

const { URL_BASE, MODELOS: MODELOS_NOMBRES, AUTENTICACION } = Constants.expoConfig.extra;
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

// En el dispositivo existe como 'respuestas.json' (minúsculas)
const RESPUESTAS_PATH = `${DATA_DIR}respuestas.json`;

/**
 * Guarda respuestas en respuestas.json
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
  } catch (error) {
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
      if (MODELOS_SOLO_LOCALES.includes(modelo)) {
        const archivoExiste = await FileSystem.getInfoAsync(filePath);
        if (!archivoExiste.exists) {
          await FileSystem.writeAsStringAsync(filePath, '[]', {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
        continue;
      }
      if (conectado) {
        await syncModeloFS(modelo, filePath);
      } else {
        const archivoExiste = await FileSystem.getInfoAsync(filePath);
        if (!archivoExiste.exists) {
          await FileSystem.writeAsStringAsync(filePath, '[]', {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
      }
    }
  } catch (_) {
    // silencio: no es sincronización hacia la API
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
      fechaSincronizacion: "",
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
      return;
    }

    const contenido = await FileSystem.readAsStringAsync(filePath);
    let respuestasData = JSON.parse(contenido);

    if (respuestasData[idCliente]) {
      delete respuestasData[idCliente];
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(respuestasData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (error) {
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
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * ========================= SINCRONIZACIÓN A LA API (FS -> API) =========================
 */

// Normaliza URL_BASE (corrige 'http:/' -> 'http://', quita '/'' final)
const normalizeBaseUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let base = raw.trim();
  base = base.replace(/^http:\/([^/])/, 'http://$1');
  base = base.replace(/^https:\/([^/])/, 'https://$1');
  base = base.replace(/\/$/, '');
  return base;
};

const BASE = normalizeBaseUrl(URL_BASE);

const defaultHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  // Autenticación opcional (Basic) si está configurada
  try {
    if (AUTENTICACION && AUTENTICACION.user && AUTENTICACION.password && globalThis.btoa) {
      const token = globalThis.btoa(`${AUTENTICACION.user}:${AUTENTICACION.password}`);
      headers['Authorization'] = `Basic ${token}`;
    }
  } catch (_) { /* sin auth si no es posible */ }
  return headers;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const postJson = async (url, body, { retries = 1, retryDelayMs = 600 } = {}) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let parsed;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.body = parsed;
        throw err;
      }
      return { ok: true, data: parsed };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(retryDelayMs);
    }
  }
  return { ok: false, error: lastErr };
};

const leerJSON = async (path, fallback = {}) => {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return fallback;
    const content = await FileSystem.readAsStringAsync(path);
    if (!content) return fallback;
    return JSON.parse(content);
  } catch (e) {
    console.warn(`❌ Error leyendo ${path}: ${e.message}`);
    return fallback;
  }
};

const escribirJSON = async (path, data) => {
  await asegurarDataDir();
  const json = JSON.stringify(data, null, 2);
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
};

const pickClienteData = (cliente) => {
  const { idCliente, fechaCreacion, fechaSincronizacion, ...rest } = cliente || {};
  return rest;
};

const getClienteByIdFromRespuestas = (respuestasData, idLocal) => {
  return respuestasData?.[idLocal] || {};
};

const getModeloLocal = async (nombre) => {
  const path = MODELOS[nombre];
  return await leerJSON(path, Array.isArray(path) ? [] : []);
};

export const syncClientesPendientesFS = async () => {
  const debug = { inicio: new Date().toISOString(), base: BASE, clientesProcesados: [] };

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('📵 Sin conexión. Se omite sincronización de clientes -> API');
    return { ok: false, razon: 'sin_conexion' };
  }

  const clientesPath = MODELOS['clientes'];
  const clientes = await leerJSON(clientesPath, []);
  const respuestasData = await leerJSON(RESPUESTAS_PATH, {});

  // Catálogo de redes sociales (para mapear nombres -> idRedSocial)
  const redesCatalog = await getModeloLocal('redes-sociales');

  const pendientes = (Array.isArray(clientes) ? clientes : []).filter(c => (c?.fechaSincronizacion ?? '') === '');

  for (const cliente of pendientes) {
    const log = { idLocal: String(cliente.idCliente), pasos: [] };
    try {
      // Paso 1: crear cliente
      const dataCliente = pickClienteData(cliente);
      const urlClientes = `${BASE}/clientes`;
      log.pasos.push({ paso: 'POST /clientes', url: urlClientes, body: dataCliente });
      const resCliente = await postJson(urlClientes, dataCliente, { retries: 2 });
      if (!resCliente.ok || !resCliente.data?.idCliente) {
        const err = resCliente.error || new Error('Respuesta sin idCliente');
        debug.clientesProcesados.push({ ...log, estado: 'fallo' });
        console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /clientes`, err?.message || '');
        continue;
      }
      const serverId = resCliente.data.idCliente;
      log.idServer = serverId;

      // Paso 2: redes sociales
      const redes = ['facebook', 'instagram', 'tiktok', 'paginaWeb']
        .map(key => ({ key, usuario: (cliente?.[key] || '').toString().trim() }))
        .filter(x => x.usuario);
      for (const r of redes) {
        // Buscar idRedSocial en catálogo por nombre (asumiendo campo nombre o codigo)
        const entry = Array.isArray(redesCatalog) ? redesCatalog.find(it => {
          const nombre = `${it?.nombre || it?.codigo || ''}`.toLowerCase();
          return nombre.includes(r.key.toLowerCase());
        }) : null;
        if (!entry?.idRedSocial) {
          log.pasos.push({ paso: `SKIP redes-sociales (${r.key})`, motivo: 'idRedSocial_no_encontrado' });
          continue;
        }
        const bodyRS = {
          usuario: r.usuario,
          cliente: { idCliente: serverId },
          redSocial: { idRedSocial: entry.idRedSocial },
        };
        const urlRS = `${BASE}/clientes-redes-sociales`;
        log.pasos.push({ paso: `POST /clientes-redes-sociales (${r.key})`, url: urlRS, body: bodyRS });
        const resRS = await postJson(urlRS, bodyRS, { retries: 1 });
        if (!resRS.ok) {
          console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /clientes-redes-sociales (${r.key})`);
        }
      }

      // Paso 3: categorías desde respuestas.json
      const respCliente = getClienteByIdFromRespuestas(respuestasData, String(cliente.idCliente));
      const categorias = Array.isArray(respCliente?.categorias) ? respCliente.categorias : [];
      for (const cat of categorias) {
        if (!cat?.idCategoria) continue;
        const bodyCat = {
          cliente: { idCliente: serverId },
          categoria: { idCategoria: cat.idCategoria },
          cantidad: cat.cantidad, // respeta el tipo provisto por el flujo
        };
        const urlCat = `${BASE}/clientes-categorias`;
        log.pasos.push({ paso: 'POST /clientes-categorias', url: urlCat, body: bodyCat });
        const resCat = await postJson(urlCat, bodyCat, { retries: 1 });
        if (!resCat.ok) {
          console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /clientes-categorias`);
        }
      }

      // Paso 4: preguntas (lote)
      const preguntas = Array.isArray(respCliente?.preguntas) ? respCliente.preguntas : [];
      if (preguntas.length > 0) {
        const bodyLote = preguntas.map(p => ({
          cliente: { idCliente: serverId },
          pregunta: { idPregunta: p.idPregunta },
          instrumento: { idInstrumento: 1 },
          respuesta: p.respuesta,
          comentarios: p.comentarios ?? '',
        }));
        const urlLote = `${BASE}/respuestas`;
        log.pasos.push({ paso: 'POST /respuestas', url: urlLote, body: bodyLote });
        const resLote = await postJson(urlLote, bodyLote, { retries: 1 });
        if (!resLote.ok) {
          console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /respuestas`);
        }
      }

      // Paso 5: formas de pago (cuando respuesta == 1)
      const formasPago = Array.isArray(respCliente?.['forma-pago']) ? respCliente['forma-pago'] : [];
      for (const fp of formasPago) {
        if (fp?.respuesta !== 1 || !fp?.idFormaPago) continue;
        const bodyFP = {
          id: serverId,
          cliente: { idCliente: serverId },
          formaPago: { idFormaPago: fp.idFormaPago },
        };
        const urlFP = `${BASE}/clientes-formas-pago`;
        log.pasos.push({ paso: 'POST /clientes-formas-pago', url: urlFP, body: bodyFP });
        const resFP = await postJson(urlFP, bodyFP, { retries: 1 });
        if (!resFP.ok) {
          console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /clientes-formas-pago`);
        }
      }

      // Paso 6: condición de pago
      const condPago = respCliente?.['condicion-pago'];
      if (condPago?.idCondicionPago) {
        const bodyCP = {
          cliente: { idCliente: serverId },
          condicionPago: { idCondicionPago: condPago.idCondicionPago },
          diaContado: Number(condPago.diaContado || 0),
          diaCredito: Number(condPago.diaCredito || 0),
        };
        const urlCP = `${BASE}/clientes-condicion-pago`;
        log.pasos.push({ paso: 'POST /clientes-condicion-pago', url: urlCP, body: bodyCP });
        const resCP = await postJson(urlCP, bodyCP, { retries: 1 });
        if (!resCP.ok) {
          console.warn(`Sincronización a API: cliente ${cliente.idCliente} fallo en /clientes-condicion-pago`);
        }
      }

      // Verificar si hubo errores en los pasos
      const huboError = log.pasos.some(p => p.error);
      if (!huboError) {
        // Actualizar fechaSincronizacion del cliente local
        const ahora = new Date().toISOString();
        const idx = clientes.findIndex(c => String(c.idCliente) === String(cliente.idCliente));
        if (idx >= 0) {
          clientes[idx] = { ...clientes[idx], fechaSincronizacion: ahora };
          await escribirJSON(clientesPath, clientes);
        }
        log.estado = 'ok';
        log.fechaSincronizacion = ahora;
      } else {
        log.estado = 'parcial';
      }
    } catch (e) {
      log.pasos.push({ paso: 'exception', error: e.message });
      log.estado = 'fallo';
    }
    debug.clientesProcesados.push(log);
  }

  debug.fin = new Date().toISOString();
  // Resumen
  const total = debug.clientesProcesados.length;
  const ok = debug.clientesProcesados.filter(c => c.estado === 'ok').length;
  const parcial = debug.clientesProcesados.filter(c => c.estado === 'parcial').length;
  const fallo = debug.clientesProcesados.filter(c => c.estado === 'fallo').length;
  console.log('Sincronización a API: resumen', { total, ok, parcial, fallo });
  debug.resumen = { total, ok, parcial, fallo };
  return { ok: true, debug };
};

// Función para invocar al inicio de la aplicación
export const syncOnStartup = async () => {
  try {
    await syncClientesPendientesFS();
  } catch (e) {
    console.warn('❌ Error en syncOnStartup:', e.message);
  }
};
