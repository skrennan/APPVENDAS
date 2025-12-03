// src/screens/MetasScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';

import { styles } from '../styles';
import  AppHeader  from '../components/AppHeader';
import FadeInView from '../components/FadeInView';

const getReferenciaAtual = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  return `${ano}-${mes}`; // ex: 2025-12
};

const getNomeMes = () => {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

// converte "dd/mm/aaaa" → Date
const parsePtBrDate = (str: string | null | undefined): Date | null => {
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const [diaStr, mesStr, anoStr] = partes;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  return new Date(ano, mes - 1, dia);
};

const MetasScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [metaValor, setMetaValor] = useState(''); // string com vírgula
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [totalComprasMes, setTotalComprasMes] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const referenciaAtual = getReferenciaAtual();
  const nomeMes = getNomeMes();

  // cria tabela de metas (se não existir) e carrega meta + resumo
  useEffect(() => {
    const preparar = async () => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS metas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referencia TEXT NOT NULL UNIQUE,
            valor_meta REAL NOT NULL
          );
        `);
        await carregarMetaAtual();
        await calcularResumoMes();
      } catch (error) {
        console.log('Erro ao preparar metas', error);
      }
    };

    preparar();
  }, [db]);

  const carregarMetaAtual = async () => {
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT valor_meta FROM metas WHERE referencia = ?;',
        [referenciaAtual]
      );
      if (rows.length > 0) {
        const valor = Number(rows[0].valor_meta || 0);
        setMetaValor(valor.toFixed(2).replace('.', ','));
      }
    } catch (error) {
      console.log('Erro ao carregar meta atual', error);
    }
  };

  const calcularResumoMes = async () => {
    setCarregando(true);
    try {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      // VENDAS
      const vendasRows = await db.getAllAsync<any>(
        'SELECT valor, data FROM vendas;'
      );
      let somaVendas = 0;
      for (const row of vendasRows) {
        const valor = Number(row.valor || 0);
        const dataStr = row.data as string | null;
        const data = parsePtBrDate(dataStr || '');
        if (!data) continue;
        if (
          data.getMonth() === mesAtual &&
          data.getFullYear() === anoAtual
        ) {
          somaVendas += valor;
        }
      }

      // COMPRAS
      const comprasRows = await db.getAllAsync<any>(
        'SELECT valor, data FROM compras;'
      );
      let somaCompras = 0;
      for (const row of comprasRows) {
        const valor = Number(row.valor || 0);
        const dataStr = row.data as string | null;
        const data = parsePtBrDate(dataStr || '');
        if (!data) continue;
        if (
          data.getMonth() === mesAtual &&
          data.getFullYear() === anoAtual
        ) {
          somaCompras += valor;
        }
      }

      setTotalVendasMes(somaVendas);
      setTotalComprasMes(somaCompras);
    } catch (error) {
      console.log('Erro ao calcular resumo do mês', error);
      Alert.alert('Erro', 'Não foi possível calcular o resumo do mês.');
    } finally {
      setCarregando(false);
    }
  };

  const salvarMeta = async () => {
    if (!metaValor.trim()) {
      Alert.alert('Atenção', 'Informe um valor para a meta do mês.');
      return;
    }

    // converte "1.234,56" → 1234.56
    const normalizado = metaValor
      .replace(/\./g, '')
      .replace(',', '.');

    const valor = Number(normalizado);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Atenção', 'Informe um valor de meta válido maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await db.runAsync(
        `
        INSERT INTO metas (referencia, valor_meta)
        VALUES (?, ?)
        ON CONFLICT(referencia) DO UPDATE SET valor_meta = excluded.valor_meta;
      `,
        [referenciaAtual, valor]
      );

      Alert.alert('Sucesso', 'Meta do mês salva com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar meta', error);
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    } finally {
      setSalvando(false);
    }
  };

  // cálculo do progresso
  const metaNumero = (() => {
    if (!metaValor.trim()) return 0;
    const normalizado = metaValor
      .replace(/\./g, '')
      .replace(',', '.');
    const n = Number(normalizado);
    return isNaN(n) ? 0 : n;
  })();

  const lucroMes = totalVendasMes - totalComprasMes;
  const progressoPercent =
    metaNumero > 0 ? Math.min((totalVendasMes / metaNumero) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <AppHeader titulo="Metas e progresso" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="bullseye-arrow"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Meta do mês</Text>
          </View>

          <Text style={styles.label}>
            Meta de faturamento para {nomeMes}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5.000,00"
            placeholderTextColor="#666a80"
            keyboardType="numeric"
            value={metaValor}
            onChangeText={setMetaValor}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={salvarMeta}
            disabled={salvando}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={18}
              color="#ffffff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>
              {salvando ? 'Salvando...' : 'Salvar meta do mês'}
            </Text>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Resumo de {nomeMes}</Text>
          </View>

          {carregando ? (
            <ActivityIndicator
              size="small"
              color="#4e9bff"
              style={{ marginVertical: 10 }}
            />
          ) : (
            <>
              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Vendas no mês</Text>
                <Text style={styles.resumoValor}>
                  R$ {totalVendasMes.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Compras no mês</Text>
                <Text style={styles.resumoValor}>
                  R$ {totalComprasMes.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={styles.resumoLinha}>
                <Text style={styles.resumoTitulo}>Lucro estimado</Text>
                <Text
                  style={[
                    styles.resumoValor,
                    lucroMes >= 0
                      ? styles.resumoBadgePositivo
                      : styles.resumoBadgeNegativo,
                  ]}
                >
                  R$ {lucroMes.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              {metaNumero > 0 && (
                <>
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Progresso da meta</Text>
                    <View style={styles.barraContainer}>
                      <View
                        style={[
                          styles.barraPreenchida,
                          { width: `${progressoPercent}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.barraLegenda}>
                      <Text style={styles.resumoTitulo}>
                        {progressoPercent.toFixed(1).replace('.', ',')}% atingido
                      </Text>
                      <Text style={styles.resumoTitulo}>
                        Meta: R$ {metaNumero.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={calcularResumoMes}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color="#4e9bff"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>
                  Atualizar resumo
                </Text>
              </TouchableOpacity>
            </>
          )}
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default MetasScreen;
