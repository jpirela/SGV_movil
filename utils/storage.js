// utils/storage.js
import { Platform } from 'react-native';

// Detectar si estamos en web
const isWeb = Platform.OS === 'web';

// Importaciones condicionales para evitar errores en web
let FileSystem = null;
let File = null;
let Directory = null;
let Paths = null;

if (!isWeb) {
  try {
    FileSystem = require('expo-file-system/legacy');
    const FileSystemNew = require('expo-file-system');
    File = FileSystemNew.File;
    Directory = FileSystemNew.Directory;
    Paths = FileSystemNew.Paths;
  } catch (error) {
    console.warn('⚠️ expo-file-system no disponible:', error.message);
  }
}

// Implementación para web usando localStorage
class WebStorage {
  static getDataDir() {
    return 'app_data/';
  }

  static async writeAsStringAsync(path, content) {
    const key = this.pathToKey(path);
    localStorage.setItem(key, content);
  }

  static async readAsStringAsync(path) {
    const key = this.pathToKey(path);
    return localStorage.getItem(key) || '';
  }

  static async getInfoAsync(path) {
    const key = this.pathToKey(path);
    const exists = localStorage.getItem(key) !== null;
    return { exists };
  }

  static pathToKey(path) {
    // Convertir path a clave de localStorage
    return path.replace(/[\/\\]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  static async deleteAsync(path) {
    const key = this.pathToKey(path);
    localStorage.removeItem(key);
  }
}

// Implementación unificada
class UniversalStorage {
  constructor() {
    this.isWeb = isWeb;
    this.dataDir = this.isWeb ? WebStorage.getDataDir() : (FileSystem?.documentDirectory + 'data/');
  }

  async ensureDataDir() {
    if (this.isWeb) {
      // En web no necesitamos crear directorios físicos
      return;
    }
    
    if (FileSystem && Directory && Paths) {
      const dataDirectory = new Directory(Paths.document, 'data');
      if (!dataDirectory.exists) {
        dataDirectory.create();
      }
    }
  }

  getPath(filename) {
    return this.isWeb ? `${this.dataDir}${filename}` : `${this.dataDir}${filename}`;
  }

  async writeJSON(filename, data) {
    await this.ensureDataDir();
    const path = this.getPath(filename);
    const content = JSON.stringify(data, null, 2);
    
    if (this.isWeb) {
      await WebStorage.writeAsStringAsync(path, content);
    } else if (FileSystem) {
      await FileSystem.writeAsStringAsync(path, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      throw new Error('Sistema de archivos no disponible');
    }
  }

  async readJSON(filename, fallback = null) {
    try {
      const path = this.getPath(filename);
      let content;
      
      if (this.isWeb) {
        content = await WebStorage.readAsStringAsync(path);
      } else if (FileSystem) {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) {
          return fallback;
        }
        content = await FileSystem.readAsStringAsync(path);
      } else {
        return fallback;
      }

      if (!content || content.trim() === '') {
        return fallback;
      }

      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Error leyendo ${filename}:`, error.message);
      return fallback;
    }
  }

  async fileExists(filename) {
    try {
      const path = this.getPath(filename);
      
      if (this.isWeb) {
        const info = await WebStorage.getInfoAsync(path);
        return info.exists;
      } else if (FileSystem) {
        const info = await FileSystem.getInfoAsync(path);
        return info.exists;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async deleteFile(filename) {
    try {
      const path = this.getPath(filename);
      
      if (this.isWeb) {
        await WebStorage.deleteAsync(path);
      } else if (FileSystem) {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error eliminando ${filename}:`, error.message);
    }
  }
}

// Instancia global
export const storage = new UniversalStorage();

// Exportar también la clase para casos específicos
export { UniversalStorage };

// Información de la plataforma
export const platformInfo = {
  isWeb,
  isMobile: !isWeb,
  hasFileSystem: !isWeb && FileSystem !== null,
};