# SGV Ventas - Aplicación Móvil

SGV Ventas es una aplicación móvil diseñada para gestionar la venta de productos a través de interfaces intuitivas. Garantiza una experiencia de usuario fluida para administrar clientes y productos, y facilita el seguimiento y registro de las ventas.

## Funcionalidad Principal

- **Gestión de Clientes:** Agrega, modifica, y elimina clientes.
- **Registro de Ventas:** Recolección de datos sobre las ventas de huevos.

## Prerrequisitos

1. **Node.js**: Asegúrate de tener Node.js instalado. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
2. **Yarn**: Utilizado como administrador de paquetes. Instálalo globalmente ejecutando:
   ```bash
   npm install -g yarn
   ```
3. **Base de Datos MySQL**: Es necesario importar los datos de `data.sql` en tu base de datos MySQL.
   
## Instalación

1. Clona este repositorio:
   ```bash
   git clone <repositorio-url>
   ```
2. Navega al directorio del proyecto e instala las dependencias:
   ```bash
   yarn install
   ```

## Estructura de Carpetas

```
SGV_movil/
├── App.js
├── README.md
├── app.config.js
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   └── ...
├── components/
│   └── Input/
├── pages/
│   ├── Inicio.js
│   ├── AgregarCliente.js
│   ├── FichaCliente.js
│   ├── FichaHuevos.js
│   └── MostrarDatos.js
├── utils/
│   └── syncDataFS.js
├── package.json
└── yarn.lock
```

## Descripción de Módulos
- `App.js`: Archivo principal que inicializa la aplicación.
- `pages/`: Contiene los componentes de cada página.
- `components/`: Componentes reutilizables como entradas de texto y botones.
- `utils/`: Funcionalidades de sincronización con sistema de archivos y API.

## Configuración `app.config.js`
El archivo `app.config.js` es crucial para definir las configuraciones del backend:

- **URL_BASE**: Define la base de las URLs para todos los endpoints.
- **MODELOS**: Listado de entidades para las cuales se realizarán las consultas.
- **RESPUESTAS**: Endpoints para las cuales se realizarán la actualizacion con la API.
- **AUTENTICACION**: Credenciales básicas para la autenticación de la aplicación.

## Ejecución con Expo
Antes de iniciar la ejecución con Expo, asegúrate de:

1. Activar la API y anotar la IP.
2. Actualizar `app.config.js` con la nueva IP.
3. Desactivar el firewall privado de Windows para permitir las comunicaciones.

Para ejecutar la aplicación:
```bash
npx expo start
```
Este comando abrirá una interfaz para simular la aplicación en dispositivos o emuladores.

```bash
$ yarn start
yarn run v1.22.22
$ expo start
Starting project at C:\Users\jpire\Proyectos\InfoSoft\SGV\SGV_movil
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █ ██▀▀ ▀▄▀█ ▄▄▄▄▄ █
█ █   █ █  ▀█ ▀█ ▄█ █   █ █
█ █▄▄▄█ █▀  █▄▄▀▄██ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄█ ▀▄█▄█▄█▄▄▄▄▄▄▄█
█▄▄██ ▄▄█▀█▄█▄█▄ ███ ▀▄▄ ▄█
███▄▀ ▀▄█▀ ▄█▀▄█ ▀▀ █▄  ▀██
█▀▀█ ▀█▄ ▄█▀▄▀█▄▀▄▀▄▀▀▄ ▀██
███▀▀▄▄▄█ ▀█ ▄██▄▄▄█▄▀ ▀███
█▄▄▄▄█▄▄█ ▀▄█▄▀▄▄ ▄▄▄ ▀ ▄▄█
█ ▄▄▄▄▄ █▀ ▀█▀██▀ █▄█ ▀▀▀██
█ █   █ █▄ ▄▄ █▄█▄▄ ▄▄▀ ▀▀█
█ █▄▄▄█ █▀ ▀ ▄██▄██▄▀█▀▀ ██
█▄▄▄▄▄▄▄█▄▄▄███▄████▄▄▄▄▄▄█

› Metro waiting on exp://192.168.1.102:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Web is waiting on http://localhost:8081

› Using Expo Go
› Press s │ switch to development build

› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```
