// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importar el navigationRef
import { navigationRef } from './utils/navigationService';

import SplashScreen from './pages/SplashScreen';
import Inicio from './pages/Inicio';
import AgregarCliente from './pages/AgregarCliente';
import MostrarDatos from './pages/MostrarDatos';
import Login from './pages/Login';
import Admin from './pages/Admin';
import EditarDatos from './pages/EditarDatos';

const Stack = createStackNavigator();

export default function App() {
  return (
    // 👇 Pasamos el ref aquí
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName='Splash'>
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="Admin" component={Admin} />
        <Stack.Screen name="AgregarCliente" component={AgregarCliente} />
        <Stack.Screen name="MostrarDatos" component={MostrarDatos} />
        <Stack.Screen name="EditarDatos" component={EditarDatos} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
