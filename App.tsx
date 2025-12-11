// App.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { Text, View, Platform } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  SQLiteProvider,
  useSQLiteContext,
  SQLiteDatabase,
} from 'expo-sqlite';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { styles, COLORS } from './src/styles';

// ==== IMPORTE SUAS TELAS AQUI (ajuste os caminhos se preciso) ====
import VendasScreen from './src/screens/VendasScreen';
import StatusVendasScreen from './src/screens/StatusVendasScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import MetasRelatoriosScreen from './src/screens/MetasRelatoriosScreen';
import ComprasScreen from './src/screens/ComprasScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import OrcamentoScreen from './src/screens/OrcamentoScreen';

// ================================================================

// ---------- Tipos ----------
export interface LojaConfig {
  id: number;
  nome: string;
  contato: string;
  observacoes: string;
  logoUri: string | null;
}

export interface DbContextType {
  db: SQLiteDatabase;
  lojaConfig: LojaConfig | null;
  setLojaConfig: (cfg: LojaConfig | null) => void;
}

export const DbContext = createContext<DbContextType | null>(null);

const Tab = createBottomTabNavigator();

// ---------- Provider que inicializa o banco e carrega loja_config ----------
function DatabaseProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [lojaConfig, setLojaConfig] = useState<LojaConfig | null>(null);

  // Cria as tabelas
  useEffect(() => {
    const initDb = async () => {
      try {
        await db.execAsync(`
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT NOT NULL,
            valor REAL NOT NULL,
            custo REAL NOT NULL,
            lucro REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'feita',
            cliente TEXT
          );

          CREATE TABLE IF NOT EXISTS venda_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venda_id INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT NOT NULL,
            valor REAL NOT NULL,
            custo REAL NOT NULL,
            FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS metas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ano INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            metaFaturamento REAL NOT NULL,
            metaLucro REAL NOT NULL
          );

          CREATE TABLE IF NOT EXISTS loja_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            contato TEXT NOT NULL,
            observacoes TEXT NOT NULL,
            logoUri TEXT
          );

          CREATE TABLE IF NOT EXISTS compras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            descricao TEXT NOT NULL,
            categoria TEXT NOT NULL,
            fornecedor TEXT,
            valor REAL NOT NULL,
            observacoes TEXT
          );

          CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT,
            observacoes TEXT
          );
        `);
      } catch (error) {
        console.log('Erro ao criar tabelas:', error);
      }
    };

    initDb();
  }, [db]);

  // Carrega a configuração da loja
  useEffect(() => {
    const carregarLoja = async () => {
      try {
        const rows = await db.getAllAsync<LojaConfig>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );
        if (rows.length > 0) {
          setLojaConfig(rows[0]);
        }
      } catch (error) {
        console.log('Erro ao carregar loja_config:', error);
      }
    };

    carregarLoja();
  }, [db]);

  const value = useMemo(
    () => ({
      db,
      lojaConfig,
      setLojaConfig,
    }),
    [db, lojaConfig]
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

// ---------- Navigator com Bottom Tabs (com SafeArea) ----------
function MainTabs() {
  const insets = useSafeAreaInsets();

  // distância extra pro Android não ficar em cima da barra do sistema
  const bottomInset = insets.bottom || (Platform.OS === 'android' ? 8 : 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: bottomInset,
            height: 56 + bottomInset,
          },
        ],
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabel: ({ focused, color }) => (
          <Text
            style={[
              styles.tabBarLabel,
              { color },
              focused && styles.tabBarLabelFocused,
            ]}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
            'home-outline';

          switch (route.name) {
            case 'Vendas':
              iconName = 'cart-outline';
              break;
            case 'Status':
              iconName = 'clipboard-check-outline';
              break;
            case 'Relatórios':
              iconName = 'chart-line';
              break;
            case 'Metas':
              iconName = 'target';
              break;
            case 'Compras':
              iconName = 'cart-arrow-down';
              break;
            case 'Clientes':
              iconName = 'account-group-outline';
              break;
            case 'Config':
              iconName = 'cog-outline';
              break;
          }

          return (
            <View style={styles.tabBarIconWrapper}>
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={focused ? COLORS.primary : color}
              />
            </View>
          );
        },
      })}
    >
      {/* Ajuste os nomes das abas como você quiser */}
      <Tab.Screen name="Vendas" component={VendasScreen} />
      <Tab.Screen name="Status" component={StatusVendasScreen} />
      <Tab.Screen name="Relatórios" component={RelatoriosScreen} />
      <Tab.Screen name="Compras" component={ComprasScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
      <Tab.Screen
  name="Orcamentos"
  component={OrcamentoScreen}
  options={{
    tabBarLabel: 'Orçamentos',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons
        name="hand-coin"
        size={size}
        color={color}
      />
    ),
  }}
/>

    </Tab.Navigator>
  );
}

// ---------- App raiz ----------
export default function App() {
  return (
    <SQLiteProvider databaseName="vendas_personalizados.db">
      <SafeAreaProvider>
        <DatabaseProvider>
          <NavigationContainer>
            <MainTabs />
          </NavigationContainer>
        </DatabaseProvider>
      </SafeAreaProvider>
    </SQLiteProvider>
  );
}
