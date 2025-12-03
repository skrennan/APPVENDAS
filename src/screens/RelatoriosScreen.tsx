// src/screens/RelatoriosScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type VendaRow = {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  lucro: number;
  status: string;
};

type CompraRow = {
  id: number;
  data: string;
  descricao: string;
  categoria: string;
  fornecedor?: string | null;
  valor: number;
};

type PeriodoRapido =
  | 'hoje'
  | 'ontem'
  | 'semana'
  | 'mes_atual'
  | 'mes_passado'
  | 'ano'
  | 'personalizado';

const normalizarData = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatarDataBR = (d: Date) => {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// aceita tanto "YYYY-MM-DD" quanto "DD/MM/YYYY"
const parseDataBanco = (dataStr: string | null | undefined): Date | null => {
  if (!dataStr) return null;
  const s = dataStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // ISO
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    // BR
    const [dia, mes, ano] = s.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return null;
};

const RelatoriosScreen: React.FC = () => {
  const db = useSQLiteContext();

  const hoje = new Date();
  const hojeNorm = normalizarData(hoje);
  const anoAtual = hojeNorm.getFullYear();
  const mesAtual = hojeNorm.getMonth();

  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);

  const [periodoRapido, setPeriodoRapido] =
    useState<PeriodoRapido>('mes_atual');

  const [dataInicioPersonalizado, setDataInicioPersonalizado] =
    useState<Date>(primeiroDiaMes);
  const [dataFimPersonalizado, setDataFimPersonalizado] =
    useState<Date>(hojeNorm);

  const [carregando, setCarregando] = useState(false);

  const [totalVendas, setTotalVendas] = useState(0);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalEmAberto, setTotalEmAberto] = useState(0);
  const [lucroVendas, setLucroVendas] = useState(0);
  const [qtdVendas, setQtdVendas] = useState(0);

  const [totalCompras, setTotalCompras] = useState(0);
  const [qtdCompras, setQtdCompras] = useState(0);

  const lucroLiquido = lucroVendas - totalCompras;

  const obterIntervaloDatas = (): { inicio: Date; fim: Date } => {
    const hoje = normalizarData(new Date());
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    switch (periodoRapido) {
      case 'hoje': {
        return { inicio: hoje, fim: hoje };
      }
      case 'ontem': {
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        return { inicio: ontem, fim: ontem };
      }
      case 'semana': {
        // semana atual (seg → hoje)
        const diaSemana = hoje.getDay(); // 0 = domingo
        const diffSeg = (diaSemana + 6) % 7; // segunda-feira
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - diffSeg);
        return { inicio, fim: hoje };
      }
      case 'mes_atual': {
        const inicio = new Date(ano, mes, 1);
        const fim = new Date(ano, mes + 1, 0);
        return { inicio, fim };
      }
      case 'mes_passado': {
        const inicio = new Date(ano, mes - 1, 1);
        const fim = new Date(ano, mes, 0);
        return { inicio, fim };
      }
      case 'ano': {
        const inicio = new Date(ano, 0, 1);
        const fim = new Date(ano, 11, 31);
        return { inicio, fim };
      }
      case 'personalizado': {
        let inicio = normalizarData(dataInicioPersonalizado);
        let fim = normalizarData(dataFimPersonalizado);
        if (fim < inicio) {
          // se usuário inverter as datas, a gente corrige
          const tmp = inicio;
          inicio = fim;
          fim = tmp;
        }
        return { inicio, fim };
      }
      default:
        return { inicio: primeiroDiaMes, fim: ultimoDiaMes };
    }
  };

  const abrirDatePickerInicio = () => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: dataInicioPersonalizado,
      onChange: (_event, date) => {
        if (date) {
          setDataInicioPersonalizado(normalizarData(date));
        }
      },
    });
  };

  const abrirDatePickerFim = () => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: dataFimPersonalizado,
      onChange: (_event, date) => {
        if (date) {
          setDataFimPersonalizado(normalizarData(date));
        }
      },
    });
  };

  const carregarResumo = async () => {
    try {
      setCarregando(true);

      const { inicio, fim } = obterIntervaloDatas();
      const inicioN = normalizarData(inicio);
      const fimN = normalizarData(fim);

      const listaVendas = await db.getAllAsync<VendaRow>(
        `
          SELECT id, data, descricao, valor, lucro, status
          FROM vendas;
        `
      );

      const listaCompras = await db.getAllAsync<CompraRow>(
        `
          SELECT id, data, descricao, categoria, fornecedor, valor
          FROM compras;
        `
      );

      // filtrar por período em memória
      const vendasFiltradas = (Array.isArray(listaVendas)
        ? listaVendas.filter(Boolean)
        : []
      ).filter((v) => {
        const d = parseDataBanco(v.data);
        if (!d) return false;
        const dn = normalizarData(d);
        return dn >= inicioN && dn <= fimN;
      });

      const comprasFiltradas = (Array.isArray(listaCompras)
        ? listaCompras.filter(Boolean)
        : []
      ).filter((c) => {
        const d = parseDataBanco(c.data);
        if (!d) return false;
        const dn = normalizarData(d);
        return dn >= inicioN && dn <= fimN;
      });

      // agregados de vendas
      const totalV = vendasFiltradas.reduce(
        (acc, v) => acc + (v.valor || 0),
        0
      );
      const totalL = vendasFiltradas.reduce(
        (acc, v) => acc + (v.lucro || 0),
        0
      );
      const totalRec = vendasFiltradas.reduce((acc, v) => {
        const s = (v.status || '').toLowerCase();
        if (s === 'paga' || s === 'pago' || s === 'entregue') {
          return acc + (v.valor || 0);
        }
        return acc;
      }, 0);
      const totalAberto = vendasFiltradas.reduce((acc, v) => {
        const s = (v.status || '').toLowerCase();
        if (s === 'feita' || s === 'pronta') {
          return acc + (v.valor || 0);
        }
        return acc;
      }, 0);

      // agregados de compras
      const totalC = comprasFiltradas.reduce(
        (acc, c) => acc + (c.valor || 0),
        0
      );

      setTotalVendas(totalV);
      setLucroVendas(totalL);
      setTotalRecebido(totalRec);
      setTotalEmAberto(totalAberto);
      setQtdVendas(vendasFiltradas.length);

      setTotalCompras(totalC);
      setQtdCompras(comprasFiltradas.length);
    } catch (error) {
      console.log('Erro ao carregar resumo de relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarResumo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoRapido, dataInicioPersonalizado, dataFimPersonalizado]);

  const { inicio, fim } = obterIntervaloDatas();
  const periodoLabel = `${formatarDataBR(inicio)} até ${formatarDataBR(fim)}`;

  const formatMoney = (v: number) =>
    `R$ ${v.toFixed(2).replace('.', ',')}`;

  const lucroPositivo = lucroLiquido >= 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView>
          <AppHeader titulo="Relatórios e Caixa" />

          {/* FILTROS DE PERÍODO */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Período</Text>

            <View style={styles.filtroLinha}>
              {(
                [
                  { id: 'hoje', label: 'Hoje' },
                  { id: 'ontem', label: 'Ontem' },
                  { id: 'semana', label: 'Esta semana' },
                  { id: 'mes_atual', label: 'Mês atual' },
                  { id: 'mes_passado', label: 'Mês passado' },
                  { id: 'ano', label: 'Ano' },
                  { id: 'personalizado', label: 'Personalizado' },
                ] as { id: PeriodoRapido; label: string }[]
              ).map((p) => {
                const ativo = periodoRapido === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.filtroBotao,
                      ativo && styles.filtroBotaoAtivo,
                    ]}
                    onPress={() => setPeriodoRapido(p.id)}
                  >
                    <Text
                      style={[
                        styles.filtroBotaoTexto,
                        ativo && styles.filtroBotaoTextoAtivo,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {periodoRapido === 'personalizado' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Selecionar datas</Text>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.filtroCampo}>
                    <TouchableOpacity
                      style={styles.filtroDataBotao}
                      onPress={abrirDatePickerInicio}
                    >
                      <MaterialCommunityIcons
                        name="calendar-start"
                        size={18}
                        color="#e5e7eb"
                      />
                      <Text style={styles.filtroDataTexto}>
                        {formatarDataBR(dataInicioPersonalizado)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filtroCampo}>
                    <TouchableOpacity
                      style={styles.filtroDataBotao}
                      onPress={abrirDatePickerFim}
                    >
                      <MaterialCommunityIcons
                        name="calendar-end"
                        size={18}
                        color="#e5e7eb"
                      />
                      <Text style={styles.filtroDataTexto}>
                        {formatarDataBR(dataFimPersonalizado)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View style={{ marginTop: 8 }}>
              <Text style={styles.resumoLinha}>
                Período selecionado:{' '}
                <Text style={styles.resumoValor}>{periodoLabel}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.botaoSecundario, { marginTop: 12 }]}
              onPress={carregarResumo}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoSecundarioTexto}>
                {carregando ? 'Atualizando...' : 'Recalcular resumo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* RESUMO DE VENDAS */}
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitulo}>Vendas no período</Text>
            <Text style={styles.resumoValorGrande}>
              {formatMoney(totalVendas)}
            </Text>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Recebido (pago/entregue)</Text>
              <Text style={styles.resumoValorLinha}>
                {formatMoney(totalRecebido)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Em aberto (feita/pronta)</Text>
              <Text style={styles.resumoValorLinha}>
                {formatMoney(totalEmAberto)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Lucro das vendas</Text>
              <Text style={styles.resumoValorLinha}>
                {formatMoney(lucroVendas)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Quantidade de vendas</Text>
              <Text style={styles.resumoValorLinha}>{qtdVendas}</Text>
            </View>
          </View>

          {/* RESUMO DE COMPRAS */}
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitulo}>Compras no período</Text>
            <Text style={styles.resumoValorGrande}>
              {formatMoney(totalCompras)}
            </Text>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Quantidade de compras</Text>
              <Text style={styles.resumoValorLinha}>{qtdCompras}</Text>
            </View>
          </View>

          {/* CAIXA / LUCRO LÍQUIDO */}
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitulo}>Caixa / Lucro líquido</Text>

            <Text
              style={[
                styles.resumoValorGrande,
                lucroPositivo
                  ? styles.resumoBadgePositivo
                  : styles.resumoBadgeNegativo,
              ]}
            >
              {formatMoney(lucroLiquido)}
            </Text>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Lucro das vendas</Text>
              <Text style={styles.resumoValorLinha}>
                {formatMoney(lucroVendas)}
              </Text>
            </View>

            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>(-) Compras / custos</Text>
              <Text style={styles.resumoValorLinha}>
                {formatMoney(totalCompras)}
              </Text>
            </View>

            <View style={[styles.resumoRow, { marginTop: 8 }]}>
              <Text style={styles.resumoLabel}>Resultado líquido</Text>
              <Text
                style={[
                  styles.resumoValorLinha,
                  lucroPositivo
                    ? styles.resumoBadgePositivo
                    : styles.resumoBadgeNegativo,
                ]}
              >
                {lucroPositivo ? 'Lucro' : 'Prejuízo'}
              </Text>
            </View>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default RelatoriosScreen;
