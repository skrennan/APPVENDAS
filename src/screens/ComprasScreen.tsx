import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type Compra = {
  id: number;
  data: string;
  descricao: string;
  categoria: string;
  fornecedor?: string | null;
  valor: number;
  observacoes?: string | null;
};

const ComprasScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  const [data, setData] = useState(() => {
    const hoje = new Date();
    const d = String(hoje.getDate()).padStart(2, '0');
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const a = hoje.getFullYear();
    return `${d}/${m}/${a}`;
  });
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<'INSUMOS' | 'FRETE' | 'OUTROS'>(
    'INSUMOS',
  );
  const [fornecedor, setFornecedor] = useState('');
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [compras, setCompras] = useState<Compra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const valorNumber = useMemo(
    () => Number(String(valor).replace(',', '.')) || 0,
    [valor],
  );

  const carregarCompras = useCallback(async () => {
    try {
      setCarregando(true);
      const rows = await db.getAllAsync<Compra>(
        'SELECT * FROM compras ORDER BY id DESC;',
      );
      setCompras(rows);
    } catch (error) {
      console.log('Erro ao carregar compras', error);
    } finally {
      setCarregando(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarCompras();
    }, [carregarCompras]),
  );

  const handleSalvar = useCallback(async () => {
    if (!descricao.trim() || !valorNumber) {
      Alert.alert(
        'Atenção',
        'Informe ao menos a descrição e o valor da compra.',
      );
      return;
    }

    try {
      setSalvando(true);
      await db.runAsync(
        `INSERT INTO compras 
         (data, descricao, categoria, fornecedor, valor, observacoes)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          data,
          descricao.trim(),
          categoria,
          fornecedor.trim() || null,
          valorNumber,
          observacoes.trim() || null,
        ],
      );

      setDescricao('');
      setFornecedor('');
      setValor('');
      setObservacoes('');

      await carregarCompras();
      Alert.alert('Sucesso', 'Compra registrada com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar compra', error);
      Alert.alert('Erro', 'Não foi possível salvar a compra.');
    } finally {
      setSalvando(false);
    }
  }, [
    db,
    data,
    descricao,
    categoria,
    fornecedor,
    valorNumber,
    observacoes,
    carregarCompras,
  ]);

  const totalCompras = compras.reduce((acc, c) => acc + (c.valor || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <AppHeader
        titulo="Compras"
        logoUri={lojaConfig?.logoUri ?? undefined}
      />

      <View style={styles.card}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="cash-minus"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Registrar compra</Text>
        </View>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: MDF 3mm"
          placeholderTextColor={COLORS.textMuted}
          value={descricao}
          onChangeText={setDescricao}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Categoria</Text>
        <View style={styles.tipoLinha}>
          {(['INSUMOS', 'FRETE', 'OUTROS'] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tipoBotao,
                categoria === cat && styles.tipoBotaoAtivo,
              ]}
              onPress={() => setCategoria(cat)}
            >
              <Text
                style={[
                  styles.tipoBotaoTexto,
                  categoria === cat && styles.tipoBotaoTextoAtivo,
                ]}
              >
                {cat === 'INSUMOS' && 'Insumos'}
                {cat === 'FRETE' && 'Frete'}
                {cat === 'OUTROS' && 'Outros'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Data</Text>
        <TextInput style={styles.input} value={data} onChangeText={setData} />

        <Text style={[styles.label, { marginTop: 12 }]}>Fornecedor</Text>
        <TextInput
          style={styles.input}
          placeholder="Opcional"
          placeholderTextColor={COLORS.textMuted}
          value={fornecedor}
          onChangeText={setFornecedor}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 50"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={valor}
          onChangeText={setValor}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Observações</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          value={observacoes}
          onChangeText={setObservacoes}
        />

        <TouchableOpacity
          style={[styles.botaoPrimario, { marginTop: 18 }]}
          onPress={handleSalvar}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color={COLORS.primaryText} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="content-save-outline"
                size={20}
                color={COLORS.primaryText}
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoPrimarioTexto}>Salvar compra</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="clipboard-list"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Compras recentes</Text>
        </View>

        {carregando && compras.length === 0 && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
        )}

        {compras.length === 0 && !carregando && (
          <Text style={styles.listaVaziaTexto}>
            Nenhuma compra registrada até o momento.
          </Text>
        )}

        {compras.map(compra => (
          <View key={compra.id} style={styles.compraItem}>
            <View style={styles.compraLinhaSuperior}>
              <View style={{ flex: 1 }}>
                <Text style={styles.compraFornecedor}>
                  {compra.fornecedor || 'Fornecedor não informado'}
                </Text>
                <Text style={styles.compraDescricao}>{compra.descricao}</Text>
              </View>
              <Text style={styles.comprasResumoValor}>
                R$ {compra.valor.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.compraDataValor}>
              {compra.data} • {compra.categoria}
            </Text>
          </View>
        ))}

        {compras.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.resumoLabel}>Total em compras</Text>
            <Text style={styles.resumoValorLinha}>
              R$ {totalCompras.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ComprasScreen;
