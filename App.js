import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Inicio from './pages/Inicio';
import AgregarCliente from './pages/AgregarCliente';
import MostrarDatos from './pages/MostrarDatos';
import { View, Image, StyleSheet } from 'react-native';
import { syncTodosLosModelosFS } from './utils/syncDataFS';

const Stack = createStackNavigator();

// ✅ Encabezado personalizado
const CustomHeader = ({ title }) => (
  <View style={styles.headerContainer}>
    <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode='contain' />
  </View>
);

export default function App() {
  useEffect(() => {
    syncTodosLosModelosFS(); // Se ejecuta al iniciar la app
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Inicio"
        screenOptions={{
          headerTitle: (props) => <CustomHeader {...props} />,
        }}
      >
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="AgregarCliente" component={AgregarCliente} />
        <Stack.Screen name="MostrarDatos" component={MostrarDatos} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 150,
    height: 50,
  },
});