// app.config.js
export default {
  expo: {
    name: 'SGV Ventas',
    slug: 'sgv-ventas',
    version: '1.0.0',
    extra: {
      URL_BASE: 'http://192.168.1.108:8080/api',
      MODELOS: [
        'clientes',
        'estados',
        'ciudades',
        'categorias',
        'preguntas',
        'formas-pago',
        'condiciones-pago'
      ],
      RESPUESTAS: [
        'clientes',
        'clientes-categorias',
        'respuestas',
        'clientes-forma-pago',
        'clientes-condicion-pago'
      ],
      AUTENTICACION: {
        user: 'admin',
        password: 'admin123',
      },
    },
  },
};
