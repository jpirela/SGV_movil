import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Inicio from './pages/Inicio';
import AgregarCliente from './pages/AgregarCliente';
import MostrarDatos from './pages/MostrarDatos';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { View, Image, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const Stack = createStackNavigator();

export default function App() {
  const mode = Constants.expoConfig?.extra?.MODE || 'production';
  const initial = mode === 'development' ? 'Login' : 'Inicio';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initial}
      >
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="Admin" component={Admin} />
        <Stack.Screen name="AgregarCliente" component={AgregarCliente} />
        <Stack.Screen name="MostrarDatos" component={MostrarDatos} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
