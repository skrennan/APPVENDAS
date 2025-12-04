// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from 'expo-sqlite';

import VendasScreen from './src/screens/VendasScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import MetasRelatoriosScreen from './src/screens/MetasRelatoriosScreen';
import OrcamentoScreen from './src/screens/OrcamentoScreen';
import LoginScreen from './src/screens/LoginScreen';
import StatusVendasScreen from './src/screens/StatusVendasScreen';
import ComprasScreen from './src/screens/ComprasScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import type { LojaConfig } from './src/utils';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

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

  // caso a tabela vendas seja antiga sem status, tenta adicionar
  try {
    await db.execAsync(`
      ALTER TABLE vendas ADD COLUMN status TEXT NOT NULL DEFAULT 'feita';
    `);
  } catch (_error) {
    // coluna já existe, tudo bem
  }

  // caso a tabela vendas seja antiga sem cliente, tenta adicionar
  try {
    await db.execAsync(`
      ALTER TABLE vendas ADD COLUMN cliente TEXT;
    `);
  } catch (_error) {
    // coluna já existe, tudo bem
  }
}

// ordem das abas para o swipe lateral
const TAB_ORDER = [
  'Vendas',
  'Clientes',
  'Status',
  'Relatorios',
  'Metas',
  'Orcamento',
  'Compras',
] as const;

function withSwipeTabs<P>(
  WrappedComponent: React.ComponentType<P>,
  routeName: (typeof TAB_ORDER)[number]
) {
  return (props: any) => {
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 15,
        onPanResponderRelease: (_evt, gestureState) => {
          const { dx } = gestureState;
          const currentIndex = TAB_ORDER.indexOf(routeName);
          const navigation = props.navigation;

          // arrastou pra esquerda -> próxima aba
          if (dx < -50 && currentIndex < TAB_ORDER.length - 1) {
            const next = TAB_ORDER[currentIndex + 1];
            navigation?.navigate(next as never);
          }

          // arrastou pra direita -> aba anterior
          if (dx > 50 && currentIndex > 0) {
            const prev = TAB_ORDER[currentIndex - 1];
            navigation?.navigate(prev as never);
          }
        },
      })
    ).current;

    return (
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <WrappedComponent {...(props as P)} />
      </View>
    );
  };
}

// versões das telas com swipe habilitado
const VendasWithSwipe = withSwipeTabs(VendasScreen, 'Vendas');
const ClientesWithSwipe = withSwipeTabs(ClientesScreen, 'Clientes');
const StatusWithSwipe = withSwipeTabs(StatusVendasScreen, 'Status');
const RelatoriosWithSwipe = withSwipeTabs(RelatoriosScreen, 'Relatorios');
const MetasWithSwipe = withSwipeTabs(MetasRelatoriosScreen, 'Metas');
const OrcamentoWithSwipe = withSwipeTabs(OrcamentoScreen, 'Orcamento');
const ComprasWithSwipe = withSwipeTabs(ComprasScreen, 'Compras');

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#181823',
          borderTopColor: '#222',
        },
        tabBarActiveTintColor: '#4e9bff',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'dots-horizontal-circle-outline';

          if (route.name === 'Vendas') iconName = 'cart-plus';
          if (route.name === 'Clientes') iconName = 'account-group';
          if (route.name === 'Status') iconName = 'progress-check';
          if (route.name === 'Relatorios') iconName = 'file-chart-outline';
          if (route.name === 'Metas') iconName = 'target';
          if (route.name === 'Orcamento') iconName = 'file-document-outline';
          if (route.name === 'Compras') iconName = 'cart-arrow-down';

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Vendas"
        component={VendasWithSwipe}
        options={{ title: 'Vendas' }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesWithSwipe}
        options={{ title: 'Clientes' }}
      />
      <Tab.Screen
        name="Status"
        component={StatusWithSwipe}
        options={{ title: 'Status' }}
      />
      <Tab.Screen
        name="Relatorios"
        component={RelatoriosWithSwipe}
        options={{ title: 'Relatórios' }}
      />
      <Tab.Screen
        name="Metas"
        component={MetasWithSwipe}
        options={{ title: 'Metas' }}
      />
      <Tab.Screen
        name="Orcamento"
        component={OrcamentoWithSwipe}
        options={{ title: 'Orçamentos' }}
      />
      <Tab.Screen
        name="Compras"
        component={ComprasWithSwipe}
        options={{ title: 'Compras' }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const db = useSQLiteContext();
  const [initialRoute, setInitialRoute] =
    useState<'Login' | 'MainTabs' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<LojaConfig>(
          'SELECT * FROM loja_config LIMIT 1;'
        );
        setInitialRoute(row ? 'MainTabs' : 'Login');
      } catch (error) {
        console.log('Erro ao buscar loja_config', error);
        setInitialRoute('Login');
      }
    })();
  }, [db]);

  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <SQLiteProvider
      databaseName="vendas_personalizados.db"
      onInit={migrateDbIfNeeded}
    >
      <RootNavigator />
    </SQLiteProvider>
  );
};

export default App;
