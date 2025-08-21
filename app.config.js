export default {
  expo: {
    name: 'Agropecuaria Los Apamates',
    slug: 'snack-6ed096ec-79f6-4300-898d-185768ccbf9e',
    description: "Aplicación para la recolección de datos",
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },

    android: {
      package: "com.infosoft.sgvventas",
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION'
      ],
      edgeToEdgeEnabled: true,

      // ✅ Permitir tráfico HTTP sin HTTPS
      usesCleartextTraffic: true,

      // ✅ Configuración extra de seguridad de red (crear archivo en res/xml)
      networkSecurityConfig: "res/xml/network_security_config.xml"
    },

    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Esta aplicación necesita acceso a tu ubicación para generar URLs de Google Maps con tu posición actual.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Esta aplicación necesita acceso a tu ubicación para generar URLs de Google Maps con tu posición actual."
      }
    },

    web: {
      favicon: "./assets/favicon.png"
    },

    extra: {
      eas: {
        projectId: "6ee94bc9-8491-427d-a049-59410a1b5452"
      },
      URL_BASE: 'https://restcontroller-scpi.onrender.com/api',
      MODELOS: [
        'clientes',
        'redes-sociales',
        'estados',
        'municipios',
        'parroquias',
        'ciudades',
        'categorias',
        'preguntas',
        'formas-pago',
        'condiciones-pago'
      ],
      ENDPOINTS: [
        'clientes',
        'clientes-categorias',
        'respuestas',
        'clientes-forma-pago',
        'clientes-condicion-pago'
      ],
      AUTENTICACION: {
        user: {
          user: 'user',
          password: '123456'
        },
        admin: {
          user: 'admin',
          password: 'admin1234'
        }
      },
      MODE: 'development'
    }
  }
};
