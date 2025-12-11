import React, { useCallback, useContext, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type Meta = {
  id: number;
  ano: number;
  mes: number;
  metaFaturamento: number;
  metaLucro: number;
};

const MetasRelatoriosScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  const [meta, setMeta] = useState<Meta | null>(null);
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [carregando, setCarregando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth() + 1;

      const [rowMeta] = await db.getAllAsync<Meta>(
        'SELECT * FROM metas WHERE ano = ? AND mes = ? LIMIT 1;',
        [ano, mes],
      );

      const [rowFaturamento] = await db.getAllAsync<{ total: number | null }>(
        'SELECT SUM(valor) as total FROM vendas WHERE SUBSTR(data, 4, 2) = ? AND SUBSTR(data, 7, 4) = ?;',
        [String(mes).padStart(2, '0'), String(ano)],
      );

      setMeta(rowMeta ?? null);
      setFaturamentoMes(rowFaturamento?.total ?? 0);
    } catch (error) {
      console.log('Erro ao carregar metas', error);
    } finally {
      setCarregando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const progressoPercent =
    meta && meta.metaFaturamento > 0
      ? Math.min(100, (faturamentoMes / meta.metaFaturamento) * 100)
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <AppHeader
        titulo="Metas"
        logoUri={lojaConfig?.logoUri ?? undefined}
      />

      <View style={styles.card}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="target"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Metas do mês</Text>
        </View>

        {carregando && !meta && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
        )}

        {!meta && !carregando && (
          <Text style={styles.listaVaziaTexto}>
            Nenhuma meta cadastrada para este mês.
          </Text>
        )}

        {meta && (
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaTitulo}>
                {String(meta.mes).padStart(2, '0')}/{meta.ano}
              </Text>
              <Text style={styles.metaTitulo}>
                Meta: R$ {meta.metaFaturamento.toFixed(2)}
              </Text>
            </View>

            <Text style={styles.metaDescricao}>
              Lucro alvo: R$ {meta.metaLucro.toFixed(2)}
            </Text>

            <View style={styles.metaProgressoBarraFundo}>
              <View
                style={[
                  styles.metaProgressoBarraPreenchida,
                  { width: `${progressoPercent}%` },
                ]}
              />
            </View>

            <Text style={styles.metaProgressoTexto}>
              {progressoPercent.toFixed(1).replace('.', ',')}% do faturamento
              atingido • R$ {faturamentoMes.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MetasRelatoriosScreen;
