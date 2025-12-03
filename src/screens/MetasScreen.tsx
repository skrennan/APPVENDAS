// src/screens/MetasScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import AppHeader from '../components/AppHeader';       // 👈 sem chaves
import FadeInView from '../components/FadeInView';     // 👈 sem chaves
import { styles } from '../styles';

type Totais = {
  totalVendas: number;
  totalCompras: number;
  lucro: number;
};

const MetasScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [totais, setTotais] = useState<Totais>({
    totalVendas: 0,
    totalCompras: 0,
    lucro: 0,
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarTotais = async () => {
      try {
        const vendasRows = await db.getAllAsync<{ total: number }>(
          'SELECT COALESCE(SUM(valor), 0) as total FROM vendas;'
        );
        const comprasRows = await db.getAllAsync<{ total: number }>(
          'SELECT COALESCE(SUM(valor), 0) as total FROM compras;'
        );

        const totalVendas = vendasRows[0]?.total ?? 0;
        const totalCompras = comprasRows[0]?.total ?? 0;
        const lucro = totalVendas - totalCompras;

        setTotais({ totalVendas, totalCompras, lucro });
      } catch (error) {
        console.log('Erro ao carregar totais em MetasScreen:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarTotais();
  }, [db]);

  const formatarMoeda = (valor: number) =>
    `R$ ${valor.toFixed(2).replace('.', ',')}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView>
          <AppHeader titulo="Metas e Objetivos" />

          {carregando ? (
            <View
              style={{
                marginTop: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" color="#4e9bff" />
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeaderLinha}>
                <Text style={styles.cardTitulo}>Resumo financeiro</Text>
              </View>

              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Total de vendas</Text>
                <Text style={styles.resumoValor}>
                  {formatarMoeda(totais.totalVendas)}
                </Text>
              </View>

              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Total de compras</Text>
                <Text style={styles.resumoValor}>
                  {formatarMoeda(totais.totalCompras)}
                </Text>
              </View>

              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Lucro acumulado</Text>
                <Text
                  style={[
                    styles.resumoValor,
                    totais.lucro >= 0
                      ? styles.resumoBadgePositivo
                      : styles.resumoBadgeNegativo,
                  ]}
                >
                  {formatarMoeda(totais.lucro)}
                </Text>
              </View>

              <Text style={[styles.listaVaziaTexto, { marginTop: 12 }]}>
                Esses valores usam tudo o que foi lançado em vendas e compras.
                Depois podemos adicionar metas mensais e barra de progresso
                aqui.
              </Text>
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default MetasScreen;   // 👈 export default
