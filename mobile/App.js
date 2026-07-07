import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import StockScreen from './src/screens/StockScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import InventoryDetailScreen from './src/screens/InventoryDetailScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import UsersScreen from './src/screens/UsersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isBooting, isAuthenticated } = useAuth();

  if (isBooting) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: true,
          headerTintColor: colors.primaryDark,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Depo Takip' }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Ürünler' }} />
            <Stack.Screen name="Stock" component={StockScreen} options={{ title: 'Stok' }} />
            <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Sayım' }} />
            <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={{ title: 'Sayım Detayı' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
            <Stack.Screen name="Suppliers" component={SuppliersScreen} options={{ title: 'Tedarikçiler' }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Kullanıcılar' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
