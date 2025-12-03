// @ts-nocheck
import React, { useEffect, useState } from 'react';
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
      status TEXT NOT NULL DEFAULT 'FEITA'
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
  `);

  // caso a tabela vendas seja antiga sem status, tenta adicionar
  try {
    await db.execAsync(`
      ALTER TABLE vendas ADD COLUMN status TEXT NOT NULL DEFAULT 'FEITA';
    `);
  } catch (error) {
    console.log('Coluna status já existe ou erro ao adicionar:', error);
  }
}

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
          let iconName = 'dots-horizontal-circle-outline';

          if (route.name === 'Vendas') iconName = 'cart-plus';
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
        component={VendasScreen}
        options={{ title: 'Vendas' }}
      />
      <Tab.Screen
        name="Status"
        component={StatusVendasScreen}
        options={{ title: 'Status' }}
      />
      <Tab.Screen
        name="Relatorios"
        component={RelatoriosScreen}
        options={{ title: 'Relatórios' }}
      />
      <Tab.Screen
        name="Metas"
        component={MetasRelatoriosScreen}
        options={{ title: 'Metas' }}
      />
      <Tab.Screen
        name="Orcamento"
        component={OrcamentoScreen}
        options={{ title: 'Orçamentos' }}
      />
      <Tab.Screen
        name="Compras"
        component={ComprasScreen}
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
