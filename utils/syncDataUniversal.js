// utils/syncDataUniversal.js - Versión universal compatible con web y móvil
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getApiBaseUrlOrDefault } from './config';
import eventBus from './eventBus';
import Constants from 'expo-constants';
import { storage, platformInfo } from './storage';

const REMOTE_BASE = "";
const DATA_REMOTE_URL = Constants.expoConfig?.extra?.DATA_REMOTE_URL || REMOTE_BASE;

let MODELOS = {};
let MODELOS_NOMBRES = Constants.expoConfig?.extra?.MODELOS || [];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Inicializa las rutas de los modelos
 */
export const initModelos = (modelos) => {
  MODELOS_NOMBRES = modelos;
  MODELOS = {};
  modelos.forEach((modelo) => {
    MODELOS[modelo] = `${modelo}.json`;
  });
};

/**
 * Guarda respuestas en respuestas.json (versión universal)
 */
export const guardarRespuestas = async (idCliente, respuestas) => {
  try {
    console.log(`💾 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Guardando respuestas para cliente ID: ${idCliente}`);
    
    let respuestasData = await storage.readJSON('respuestas.json', {});
    
    // Si el archivo existe pero es un array (formato incorrecto), convertir a objeto
    if (Array.isArray(respuestasData)) {
      console.warn('⚠️ Respuestas.json tiene formato de array, convirtiendo a objeto');
      respuestasData = {};
    }
    
    respuestasData[idCliente] = respuestas;
    
    await storage.writeJSON('respuestas.json', respuestasData);
    
    console.log(`✅ [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Respuestas guardadas correctamente para cliente ${idCliente}`);
  } catch (error) {
    console.error('❌ Error al guardar respuestas:', error);
    throw error;
  }
};

/**
 * Lee un archivo local con los datos del modelo (versión universal)
 */
export const leerModeloFS = async (modelo) => {
  const filename = `${modelo}.json`;
  console.log(`📖 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Leyendo modelo: ${filename}`);
  
  try {
    const datos = await storage.readJSON(filename, []);
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
  console.log(`📱 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Leyendo clientes desde almacenamiento local únicamente...`);
  return await leerModeloFS('clientes');
};

/**
 * Guarda un nuevo cliente en el almacenamiento local y retorna el idCliente generado
 */
export const guardarNuevoCliente = async (clienteData) => {
  try {
    console.log(`💾 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Guardando nuevo cliente...`);
    
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
    
    await storage.writeJSON('clientes.json', clientesActualizados);

    console.log(`✅ [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Cliente guardado con ID: ${nuevoIdCliente}`);
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
  try {
    let respuestasData = await storage.readJSON('respuestas.json', {});
    
    if (respuestasData[idCliente]) {
      delete respuestasData[idCliente];
      await storage.writeJSON('respuestas.json', respuestasData);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Guarda clientes locales
 */
export const guardarClientesLocales = async (clientes) => {
  try {
    await storage.writeJSON('clientes.json', clientes || []);
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

const pickClienteData = (cliente) => {
  const { idCliente, fechaCreacion, fechaSincronizacion, ...rest } = cliente || {};
  return rest;
};

const getClienteByIdFromRespuestas = (respuestasData, idLocal) => {
  return respuestasData?.[idLocal] || {};
};

/**
 * Sincronización de clientes pendientes (versión universal)
 */
export const syncClientesPendientesFS = async () => {
  if (platformInfo.isWeb) {
    console.log('🌐 Sincronización en web - funcionalidad limitada');
    Alert.alert('Información', 'Sincronización automática no disponible en web. Los datos se guardan localmente.');
    return { ok: true, razon: 'web_local_only' };
  }

  const baseActual = await getApiBaseUrlOrDefault();
  const debug = { inicio: new Date().toISOString(), base: baseActual, clientesProcesados: [] };

  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('📵 Sin conexión. Se omite sincronización de clientes -> API');
      Alert.alert('📵 Sin conexión. Se omite sincronización de clientes -> API');
      return { ok: false, razon: 'sin_conexion' };
    }
  } catch (error) {
    console.warn('⚠️ Error verificando conexión:', error.message);
    return { ok: false, razon: 'error_conexion' };
  }

  const clientes = await storage.readJSON('clientes.json', []);
  const respuestasData = await storage.readJSON('respuestas.json', {});

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

      // 🔗 Redes sociales
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

      // 🗂 Categorías
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

      // ❓ Preguntas y respuestas
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

      // 💳 Formas de pago
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

      // 📅 Condición de pago
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

      // ✅ Marcar cliente como sincronizado
      const ahora = new Date().toISOString();
      const idx = clientes.findIndex((c) => String(c.idCliente) === String(cliente.idCliente));
      if (idx >= 0) {
        clientes[idx] = { ...clientes[idx], fechaSincronizacion: ahora };
        await storage.writeJSON('clientes.json', clientes);
        // 👇 Avisar a Inicio.js con EventBus
        eventBus.emit('clientesActualizados');
      }

      log.estado = 'ok';
      log.fechaSincronizacion = ahora;
    } catch (e) {
      log.pasos.push({ paso: 'exception', error: e.message });
      log.estado = 'fallo';
      Alert.alert("Error al guardar los datos: ", e.message);
    }
    debug.clientesProcesados.push(log);
  }

  return { ok: true, debug };
};

/**
 * Sincronización en el inicio (versión universal)
 */
export const syncOnStartup = async (onProgress) => {
  try {
    console.log(`🔄 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Sincronizando archivos maestros...`);
    
    // Inicializar modelos si no están configurados
    if (Object.keys(MODELOS).length === 0) {
      console.log('🔧 Inicializando rutas de modelos...');
      initModelos(MODELOS_NOMBRES);
    }
    
    const datosLeidos = await syncModelosFS(onProgress);
    console.log(`✅ [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Sincronización completada`);
    
    return datosLeidos;
  } catch (e) {
    console.warn('❌ Error en syncOnStartup:', e.message);
    throw e;
  }
};

/**
 * Sincronización de modelos (versión universal)
 */
export const syncModelosFS = async (onProgress) => {
  const modelosTotales = MODELOS_NOMBRES.filter((m) => m !== 'clientes');
  const datosLeidos = {};
  let contador = 0;

  if (platformInfo.isWeb && !DATA_REMOTE_URL) {
    console.log('🌐 Modo web sin URL remota - usando datos locales únicamente');
    // En web sin servidor, retornar datos vacíos por defecto
    for (const modelo of modelosTotales) {
      const datos = await storage.readJSON(`${modelo}.json`, []);
      datosLeidos[modelo] = Array.isArray(datos) ? datos : (datos?.rows ?? []);
      contador++;
      if (onProgress) onProgress(`${modelo} cargado localmente`, contador, modelosTotales.length);
    }
    return datosLeidos;
  }

  for (const modelo of modelosTotales) {
    const filename = `${modelo}.json`;
    const metaFilename = `${modelo}.meta.json`;
    const remoteUrl = `${DATA_REMOTE_URL}${modelo}.json`;
    const remoteMetaUrl = `${DATA_REMOTE_URL}${modelo}.meta.json`;

    try {
      let remoteMeta = null;
      if (!platformInfo.isWeb) {
        try {
          const metaResp = await fetch(remoteMetaUrl);
          if (metaResp.ok) remoteMeta = await metaResp.json();
        } catch (_) {}
      }

      const localExists = await storage.fileExists(filename);
      const metaExists = await storage.fileExists(metaFilename);

      let necesitaActualizar = false;
      if (!localExists || !metaExists) {
        necesitaActualizar = true;
      } else if (remoteMeta) {
        const localMeta = await storage.readJSON(metaFilename, {});
        if (
          localMeta.fecha_creacion !== remoteMeta.fecha_creacion ||
          localMeta.fecha_modificacion !== remoteMeta.fecha_modificacion
        ) {
          necesitaActualizar = true;
        }
      }

      contador++;

      if (necesitaActualizar && !platformInfo.isWeb) {
        if (onProgress) onProgress(`Actualizando datos de ${modelo}...`, contador, modelosTotales.length);
        await delay(500);

        const dataResp = await fetch(remoteUrl);
        if (!dataResp.ok) continue;
        const data = await dataResp.json();
        await storage.writeJSON(filename, data);

        if (remoteMeta) {
          await storage.writeJSON(metaFilename, remoteMeta);
        }

        datosLeidos[modelo] = Array.isArray(data) ? data : (data?.rows ?? []);
        console.log(`✅ ${modelo} sincronizado (${Array.isArray(data) ? data.length : 0} registros)`);
      } else {
        if (onProgress) onProgress(`${modelo} ya actualizado`, contador, modelosTotales.length);
        console.log(`✔️ ${modelo} ya está actualizado`);
        
        const data = await storage.readJSON(filename, []);
        datosLeidos[modelo] = Array.isArray(data) ? data : (data?.rows ?? []);
      }
    } catch (err) {
      console.warn(`❌ Error procesando ${modelo}:`, err.message);
      // En caso de error, intentar cargar datos locales
      const data = await storage.readJSON(filename, []);
      datosLeidos[modelo] = Array.isArray(data) ? data : [];
    }
  }

  if (onProgress) onProgress('Iniciando...', null, null);
  
  return datosLeidos;
};