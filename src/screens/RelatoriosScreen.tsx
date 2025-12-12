import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import { styles, COLORS } from '../styles';
import AppHeader from '../components/AppHeader';
import SwipeTabsContainer from '../components/SwipeTabsContainer';

type StatusVenda = 'feita' | 'pronta' | 'paga' | 'entregue';

interface Venda {
  id: number;
  data: string; // DD/MM/AAAA
  descricao: string;
  tipo: string;
  valor: number;
  custo: number;
  lucro: number;
  status: StatusVenda;
  cliente?: string | null;
}

interface Compra {
  id: number;
  data: string; // DD/MM/AAAA
  descricao: string;
  categoria: string;
  fornecedor?: string | null;
  valor: number;
  observacoes?: string | null;
}

function parseDataBr(dataStr: string): Date | null {
  if (!dataStr) return null;
  const parts = dataStr.split('/');
  if (parts.length !== 3) return null;
  const [diaStr, mesStr, anoStr] = parts;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);

  if (!dia || !mes || !ano) return null;
  const d = new Date(ano, mes - 1, dia);
  if (isNaN(d.getTime())) return null;
  return d;
}

const RelatoriosScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);

  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  const [loading, setLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!db) return;
    try {
      setLoading(true);

      const rowsVendas = await db.getAllAsync<Venda>(
        'SELECT * FROM vendas ORDER BY data ASC, id ASC;'
      );
      const rowsCompras = await db.getAllAsync<Compra>(
        'SELECT * FROM compras ORDER BY data ASC, id ASC;'
      );

      setVendas(rowsVendas);
      setCompras(rowsCompras);
    } catch (error) {
      console.log('Erro ao carregar dados de relatórios:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const filtrarPorPeriodo = <T extends { data: string }>(
    lista: T[]
  ): T[] => {
    const ini = parseDataBr(dataInicial);
    const fim = parseDataBr(dataFinal);

    if (!ini && !fim) return lista;

    return lista.filter((item) => {
      const d = parseDataBr(item.data);
      if (!d) return false;

      if (ini && d < ini) return false;
      if (fim) {
        const fimAjustado = new Date(fim);
        fimAjustado.setHours(23, 59, 59, 999);
        if (d > fimAjustado) return false;
      }

      return true;
    });
  };

  const vendasFiltradas = filtrarPorPeriodo(vendas);
  const comprasFiltradas = filtrarPorPeriodo(compras);

  const totalFaturamento = vendasFiltradas.reduce(
    (soma, v) => soma + (v.valor || 0),
    0
  );
  const totalLucro = vendasFiltradas.reduce(
    (soma, v) => soma + (v.lucro || 0),
    0
  );
  const totalCompras = comprasFiltradas.reduce(
    (soma, c) => soma + (c.valor || 0),
    0
  );

  const saldoLiquido = totalLucro - totalCompras;

  const resumoPeriodo =
    dataInicial.trim() || dataFinal.trim()
      ? `${dataInicial || 'início'} até ${dataFinal || 'hoje'}`
      : 'Todo o período';

  return (
    <SwipeTabsContainer>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppHeader
          titulo="Relatórios"
          logoUri={lojaConfig?.logoUri ?? undefined}
        />

          {/* CARD FILTRO / PERÍODO */}
          <View style={styles.card}>
            <View style={styles.cardHeaderLinha}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.cardTitulo}>Período de análise</Text>
            </View>

            <Text style={styles.label}>Data inicial (DD/MM/AAAA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 01/01/2025"
              placeholderTextColor={COLORS.textMuted}
              value={dataInicial}
              onChangeText={setDataInicial}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              Data final (DD/MM/AAAA)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 31/12/2025"
              placeholderTextColor={COLORS.textMuted}
              value={dataFinal}
              onChangeText={setDataFinal}
            />

            <Text style={[styles.listaVaziaTexto, { marginTop: 8 }]}>
              Se deixar em branco, o relatório considera todas as datas.
            </Text>
          </View>

          {/* CARD RESUMO GERAL */}
          <View style={styles.card}>
            <View style={styles.cardHeaderLinha}>
              <MaterialCommunityIcons
                name="chart-line"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.cardTitulo}>Resumo financeiro</Text>
            </View>

            <Text style={styles.resumoTitulo}>Período</Text>
            <Text style={styles.resumoLinha}>{resumoPeriodo}</Text>

            {loading ? (
              <Text style={[styles.emptyText, { marginTop: 10 }]}>
                Carregando dados...
              </Text>
            ) : (
              <>
                <View style={styles.resumoCard}>
                  <Text style={styles.resumoLabel}>
                    Faturamento total (vendas)
                  </Text>
                  <Text style={styles.resumoValorGrande}>
                    R$ {totalFaturamento.toFixed(2).replace('.', ',')}
                  </Text>

                  <View style={styles.resumoRow}>
                    <Text style={styles.resumoLabel}>Lucro total</Text>
                    <Text
                      style={[
                        styles.resumoValorLinha,
                        saldoLiquido >= 0
                          ? styles.resumoBadgePositivo
                          : styles.resumoBadgeNegativo,
                      ]}
                    >
                      R$ {totalLucro.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>

                  <View style={styles.resumoRow}>
                    <Text style={styles.resumoLabel}>Total em compras</Text>
                    <Text style={styles.resumoValorLinha}>
                      R$ {totalCompras.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>

                  <View style={styles.resumoRow}>
                    <Text style={styles.resumoLabel}>Saldo líquido</Text>
                    <Text
                      style={[
                        styles.resumoValorLinha,
                        saldoLiquido >= 0
                          ? styles.resumoBadgePositivo
                          : styles.resumoBadgeNegativo,
                      ]}
                    >
                      R$ {saldoLiquido.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={styles.resumoLinha}>
                    Vendas consideradas: {vendasFiltradas.length}
                  </Text>
                  <Text style={styles.resumoLinha}>
                    Compras consideradas: {comprasFiltradas.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SwipeTabsContainer>
  );
};

export default RelatoriosScreen;
