// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './pages/SplashScreen'; // 👈 añadimos
import Inicio from './pages/Inicio';
import AgregarCliente from './pages/AgregarCliente';
import MostrarDatos from './pages/MostrarDatos';
import Login from './pages/Login';
import Admin from './pages/Admin';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Splash'
      >
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
