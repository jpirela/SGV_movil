export default {
  expo: {
    owner: 'jorgepirelarivas',
    name: 'Agropecuaria Los Apamates',
    slug: 'sgv-movil',
    description: "Aplicación para la recolección de datos",
    version: '1.0.0', // versión visible para el usuario
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
      usesCleartextTraffic: true
    },

    ios: {
      buildNumber: "1", // incrementa en cada build para TestFlight/App Store
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

    plugins: [
      "expo-font"
    ],

    extra: {
      eas: {
        projectId: "8f0ae1eb-2882-44bd-9e06-db414e98d1aa"
      },
      URL_BASE: 'https://restcontroller-sa1o.onrender.com/api',
      DATA_REMOTE_URL: "https://sgvcpa-admin.web.app/data/",
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
        'clientes-forma-pago',
        'clientes-condicion-pago',
        'respuestas',
      ],
      MODE: 'development'
    }
  }
};