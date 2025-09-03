// utils/syncDataFS.js
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getApiBaseUrlOrDefault } from './config';

const DATA_DIR = FileSystem.documentDirectory + 'data/';

let MODELOS = {};
let MODELOS_NOMBRES = [];

/**
 * Inicializa las rutas de los modelos
 */
export const initModelos = (modelos) => {
  MODELOS_NOMBRES = modelos;
  MODELOS = {};
  modelos.forEach((modelo) => {
    MODELOS[modelo] = `${DATA_DIR}${modelo}.json`;
  });
};

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
    console.log(
      `✅ ${modelo}.json leído correctamente - ${
        Array.isArray(datos) ? datos.length : 'N/A'
      } registros`
    );

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
      fechaSincronizacion: '',
      ...clienteData,
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
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(respuestasData, null, 2),
        {
          encoding: FileSystem.EncodingType.UTF8,
        }
      );
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

const normalizeBaseUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let base = raw.trim();
  base = base.replace(/^http:\/([^/])/, 'http://$1');
  base = base.replace(/^https:\/([^/])/, 'https://$1');
  base = base.replace(/\/$/, '');
  return base;
};

let BASE = '';

export const getBaseUrl = async () => {
  if (!BASE) {
    BASE = normalizeBaseUrl(await getApiBaseUrlOrDefault());
  }
  return BASE;
};

export const setBaseUrl = async (url) => {
  BASE = normalizeBaseUrl(url) || BASE;
  return BASE;
};

const defaultHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
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
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }
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
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
};

const pickClienteData = (cliente) => {
  const { idCliente, fechaCreacion, fechaSincronizacion, ...rest } = cliente || {};
  return rest;
};

const getClienteByIdFromRespuestas = (respuestasData, idLocal) => {
  return respuestasData?.[idLocal] || {};
};

export const syncClientesPendientesFS = async () => {
  const baseActual = await getBaseUrl();
  const debug = { inicio: new Date().toISOString(), base: baseActual, clientesProcesados: [] };

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('📵 Sin conexión. Se omite sincronización de clientes -> API');
    Alert.alert('📵 Sin conexión. Se omite sincronización de clientes -> API') 
    return { ok: false, razon: 'sin_conexion' };
  }

  const clientesPath = MODELOS['clientes'];
  const clientes = await leerJSON(clientesPath, []);
  const respuestasData = await leerJSON(RESPUESTAS_PATH, {});

  const REDES_ID = { facebook: 1, instagram: 2, tiktok: 3, paginaWeb: 4 };

  const pendientes = (Array.isArray(clientes) ? clientes : []).filter(
    (c) => (c?.fechaSincronizacion ?? '') === ''
  );

  for (const cliente of pendientes) {
    const log = { idLocal: String(cliente.idCliente), pasos: [] };
    try {
      const dataCliente = pickClienteData(cliente);
      const urlClientes = `${baseActual}/clientes`;
      log.pasos.push({ paso: 'POST /clientes', url: urlClientes, body: dataCliente });
      const resCliente = await postJson(urlClientes, dataCliente, { retries: 2 });
      if (!resCliente.ok || !resCliente.data?.idCliente) {
        debug.clientesProcesados.push({ ...log, estado: 'fallo' });
        continue;
      }
      const serverId = resCliente.data.idCliente;
      log.idServer = serverId;

      const redes = ['facebook', 'instagram', 'tiktok', 'paginaWeb']
        .map((key) => ({ key, usuario: (cliente?.[key] || '').toString().trim() }))
        .filter((x) => x.usuario);

      for (const r of redes) {
        const idRS = REDES_ID[r.key];
        if (!idRS) continue;
        const bodyRS = {
          usuario: r.usuario,
          cliente: { idCliente: serverId },
          redSocial: { idRedSocial: idRS },
        };
        const urlRS = `${baseActual}/clientes-redes-sociales`;
        log.pasos.push({ paso: `POST /clientes-redes-sociales (${r.key})`, url: urlRS, body: bodyRS });
        await postJson(urlRS, bodyRS, { retries: 1 });
      }

      const respCliente = getClienteByIdFromRespuestas(respuestasData, String(cliente.idCliente));
      const categorias = Array.isArray(respCliente?.categorias) ? respCliente.categorias : [];
      for (const cat of categorias) {
        if (!cat?.idCategoria) continue;
        const bodyCat = {
          cliente: { idCliente: serverId },
          categoria: { idCategoria: cat.idCategoria },
          cantidad: cat.cantidad,
        };
        const urlCat = `${baseActual}/clientes-categorias`;
        log.pasos.push({ paso: 'POST /clientes-categorias', url: urlCat, body: bodyCat });
        await postJson(urlCat, bodyCat, { retries: 1 });
      }

      const preguntasRaw = Array.isArray(respCliente?.preguntas) ? respCliente.preguntas : [];
      const preguntas = preguntasRaw.flat ? preguntasRaw.flat() : [].concat(...preguntasRaw);
      if (preguntas.length > 0) {
        const bodyLote = preguntas.map((p) => ({
          cliente: { idCliente: serverId },
          pregunta: { idPregunta: p.idPregunta },
          instrumento: { idInstrumento: 1 },
          respuesta: p.respuesta,
          comentarios: (p.comentarios ?? '').toString(),
        }));
        const urlLote = `${baseActual}/respuestas/lote`;
        log.pasos.push({ paso: 'POST /respuestas/lote', url: urlLote, body: bodyLote });
        await postJson(urlLote, bodyLote, { retries: 1 });
      }

      const formasPago = Array.isArray(respCliente?.['forma-pago']) ? respCliente['forma-pago'] : [];
      for (const fp of formasPago) {
        if (fp?.respuesta !== 1 || !fp?.idFormaPago) continue;
        const bodyFP = {
          id: serverId,
          cliente: { idCliente: serverId },
          formaPago: { idFormaPago: fp.idFormaPago },
        };
        const urlFP = `${baseActual}/clientes-formas-pago`;
        log.pasos.push({ paso: 'POST /clientes-formas-pago', url: urlFP, body: bodyFP });
        await postJson(urlFP, bodyFP, { retries: 1 });
      }

      const condPago = respCliente?.['condicion-pago'];
      if (condPago?.idCondicionPago) {
        const bodyCP = {
          cliente: { idCliente: serverId },
          condicionPago: { idCondicionPago: condPago.idCondicionPago },
          diaContado: Number(condPago.diaContado || 0),
          diaCredito: Number(condPago.diaCredito || 0),
        };
        const urlCP = `${baseActual}/clientes-condicion-pago`;
        log.pasos.push({ paso: 'POST /clientes-condicion-pago', url: urlCP, body: bodyCP });
        await postJson(urlCP, bodyCP, { retries: 1 });
      }

      const ahora = new Date().toISOString();
      const idx = clientes.findIndex((c) => String(c.idCliente) === String(cliente.idCliente));
      if (idx >= 0) {
        clientes[idx] = { ...clientes[idx], fechaSincronizacion: ahora };
        await escribirJSON(clientesPath, clientes);
      }
      log.estado = 'ok';
      log.fechaSincronizacion = ahora;
    } catch (e) {
      log.pasos.push({ paso: 'exception', error: e.message });
      log.estado = 'fallo';
      Alert.alert("Error al guardar los datos: ", e.message);
    }
    debug.clientesProcesados.push(log);
    Alert.alert("Datos guardados exitosamente...");
  }

  debug.fin = new Date().toISOString();
  const total = debug.clientesProcesados.length;
  const ok = debug.clientesProcesados.filter((c) => c.estado === 'ok').length;
  const parcial = debug.clientesProcesados.filter((c) => c.estado === 'parcial').length;
  const fallo = debug.clientesProcesados.filter((c) => c.estado === 'fallo').length;
  console.log('Sincronización a API: resumen', { total, ok, parcial, fallo });
  debug.resumen = { total, ok, parcial, fallo };
  return { ok: true, debug };
};

export const syncOnStartup = async () => {
  try {
    await syncModelosFS();
  } catch (e) {
    console.warn('❌ Error en syncOnStartup:', e.message);
  }
};

export const syncModelosFS = async () => {
  await asegurarDataDir();
  const baseUrl = await getApiBaseUrlOrDefault();
  if (!baseUrl) {
    console.warn('⚠️ No hay URL base configurada');
    return;
  }
  for (const modelo of MODELOS_NOMBRES) {
    try {
      const res = await fetch(`${baseUrl}/${modelo}`, { headers: defaultHeaders() });
      if (!res.ok) {
        console.warn(`❌ Error HTTP ${res.status} en modelo ${modelo}`);
        continue;
      }
      const data = await res.json();
      await FileSystem.writeAsStringAsync(MODELOS[modelo], JSON.stringify(data, null, 2));
      console.log(
        `✅ ${modelo} sincronizado (${Array.isArray(data) ? data.length : 0} registros)`
      );
    } catch (err) {
      console.warn(`❌ Error sincronizando ${modelo}:`, err.message);
    }
  }
};
