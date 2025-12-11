import React, { useCallback, useContext, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type Resumo = {
  totalVendas: number;
  totalLucro: number;
  totalCompras: number;
};

const RelatoriosScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregarResumo = useCallback(async () => {
    try {
      setCarregando(true);

      const [rowVendas] = await db.getAllAsync<{ total: number | null }>(
        'SELECT SUM(valor) as total FROM vendas;',
      );
      const [rowLucro] = await db.getAllAsync<{ total: number | null }>(
        'SELECT SUM(lucro) as total FROM vendas;',
      );
      const [rowCompras] = await db.getAllAsync<{ total: number | null }>(
        'SELECT SUM(valor) as total FROM compras;',
      );

      setResumo({
        totalVendas: rowVendas?.total ?? 0,
        totalLucro: rowLucro?.total ?? 0,
        totalCompras: rowCompras?.total ?? 0,
      });
    } catch (error) {
      console.log('Erro ao carregar resumo', error);
    } finally {
      setCarregando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarResumo();
    }, [carregarResumo]),
  );

  const lucroLiquido = (resumo?.totalLucro ?? 0) - (resumo?.totalCompras ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <AppHeader
        titulo="Relatórios"
        logoUri={lojaConfig?.logoUri ?? undefined}
      />

      <View style={styles.card}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Resumo geral</Text>
        </View>

        {carregando && !resumo && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
        )}

        {resumo && (
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Faturamento total</Text>
            <Text style={styles.resumoValorGrande}>
              R$ {resumo.totalVendas.toFixed(2)}
            </Text>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Lucro bruto</Text>
              <Text style={styles.resumoValorLinha}>
                R$ {resumo.totalLucro.toFixed(2)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Compras / custos</Text>
              <Text style={styles.resumoValorLinha}>
                R$ {resumo.totalCompras.toFixed(2)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Lucro líquido estimado</Text>
              <Text
                style={[
                  styles.resumoValorLinha,
                  lucroLiquido >= 0
                    ? styles.resumoBadgePositivo
                    : styles.resumoBadgeNegativo,
                ]}
              >
                R$ {lucroLiquido.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RelatoriosScreen;
