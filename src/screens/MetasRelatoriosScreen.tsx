// src/screens/MetasRelatoriosScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import  styles  from '../styles';
import  AppHeader  from '../components/AppHeader';

type MetasRow = {
  id: number;
  ano: number;
  mes: number;
  metaFaturamento: number;
  metaLucro: number;
};

type TotaisRow = {
  faturamento: number | null;
  lucro: number | null;
};

const MetasRelatoriosScreen: React.FC = () => {
  const db = useSQLiteContext();

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1; // 1-12

  const [metaFaturamento, setMetaFaturamento] = useState('');
  const [metaLucro, setMetaLucro] = useState('');

  const [metaAtual, setMetaAtual] = useState<MetasRow | null>(null);
  const [faturamentoAtual, setFaturamentoAtual] = useState(0);
  const [lucroAtual, setLucroAtual] = useState(0);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    try {
      const meta = await db.getFirstAsync<MetasRow>(
        `
          SELECT * FROM metas
          WHERE ano = ? AND mes = ?
          LIMIT 1;
        `,
        ano,
        mes
      );

      if (meta) {
        setMetaAtual(meta);
        setMetaFaturamento(String(meta.metaFaturamento));
        setMetaLucro(String(meta.metaLucro));
      } else {
        setMetaAtual(null);
        setMetaFaturamento('');
        setMetaLucro('');
      }

      const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0)
        .toISOString()
        .slice(0, 10);

      const totais = await db.getFirstAsync<TotaisRow>(
        `
          SELECT 
            IFNULL(SUM(valor), 0) AS faturamento,
            IFNULL(SUM(lucro), 0) AS lucro
          FROM vendas
          WHERE data BETWEEN ? AND ?;
        `,
        primeiroDia,
        ultimoDia
      );

      setFaturamentoAtual(totais?.faturamento ?? 0);
      setLucroAtual(totais?.lucro ?? 0);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as metas e o resumo.');
    }
  }

  async function salvarMetas() {
    const metaFat = parseFloat(metaFaturamento.replace(',', '.')) || 0;
    const metaLuc = parseFloat(metaLucro.replace(',', '.')) || 0;

    if (metaFat <= 0 || metaLuc <= 0) {
      Alert.alert(
        'Atenção',
        'Informe metas de faturamento e lucro maiores que zero.'
      );
      return;
    }

    try {
      if (metaAtual) {
        await db.runAsync(
          `
            UPDATE metas
            SET metaFaturamento = ?, metaLucro = ?
            WHERE id = ?;
          `,
          metaFat,
          metaLuc,
          metaAtual.id
        );
      } else {
        await db.runAsync(
          `
            INSERT INTO metas (ano, mes, metaFaturamento, metaLucro)
            VALUES (?, ?, ?, ?);
          `,
          ano,
          mes,
          metaFat,
          metaLuc
        );
      }

      Alert.alert('Sucesso', 'Metas salvas para este mês.');
      await carregarDados();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar as metas.');
    }
  }

  const percFat =
    metaAtual && metaAtual.metaFaturamento > 0
      ? (faturamentoAtual / metaAtual.metaFaturamento) * 100
      : 0;

  const percLuc =
    metaAtual && metaAtual.metaLucro > 0
      ? (lucroAtual / metaAtual.metaLucro) * 100
      : 0;

  function formatPerc(v: number) {
    if (!isFinite(v)) return '0%';
    return `${v.toFixed(1)}%`;
  }

  const nomeMes = hoje.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader titulo="Metas do Mês" />

        {/* METAS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="target"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Metas de {nomeMes}</Text>
          </View>

          <Text style={styles.label}>Meta de faturamento (R$)</Text>
          <TextInput
            style={styles.input}
            value={metaFaturamento}
            onChangeText={setMetaFaturamento}
            keyboardType="numeric"
            placeholder="Ex: 3000"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Meta de lucro (R$)</Text>
          <TextInput
            style={styles.input}
            value={metaLucro}
            onChangeText={setMetaLucro}
            keyboardType="numeric"
            placeholder="Ex: 1500"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.botao} onPress={salvarMetas}>
            <MaterialCommunityIcons
              name="content-save-outline"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Salvar metas</Text>
          </TouchableOpacity>
        </View>

        {/* RESUMO X META */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Progresso no mês</Text>
          </View>

          <Text style={styles.label}>
            Faturamento do mês: R$ {faturamentoAtual.toFixed(2)}
          </Text>
          <Text style={styles.label}>
            Meta de faturamento:{' '}
            {metaAtual
              ? `R$ ${metaAtual.metaFaturamento.toFixed(2)} (${formatPerc(
                  percFat
                )})`
              : 'Nenhuma meta definida'}
          </Text>

          <View
            style={{
              height: 10,
              backgroundColor: '#333',
              borderRadius: 6,
              overflow: 'hidden',
              marginTop: 6,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: `${Math.min(percFat, 120)}%`,
                height: '100%',
                backgroundColor: '#4e9bff',
              }}
            />
          </View>

          <Text style={styles.label}>
            Lucro do mês: R$ {lucroAtual.toFixed(2)}
          </Text>
          <Text style={styles.label}>
            Meta de lucro:{' '}
            {metaAtual
              ? `R$ ${metaAtual.metaLucro.toFixed(2)} (${formatPerc(
                  percLuc
                )})`
              : 'Nenhuma meta definida'}
          </Text>

          <View
            style={{
              height: 10,
              backgroundColor: '#333',
              borderRadius: 6,
              overflow: 'hidden',
              marginTop: 6,
            }}
          >
            <View
              style={{
                width: `${Math.min(percLuc, 120)}%`,
                height: '100%',
                backgroundColor: '#3ddc84',
              }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MetasRelatoriosScreen;
