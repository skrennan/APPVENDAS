// src/screens/ComprasScreen.tsx
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
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import  styles  from '../styles';
import  AppHeader  from '../components/AppHeader';
import { formatDateToBR } from '../utils';

type CategoriaCompra = 'INSUMO' | 'FRETE' | 'FIXO' | 'OUTRO';

type CompraRow = {
  id: number;
  data: string;
  descricao: string;
  categoria: CategoriaCompra;
  fornecedor: string | null;
  valor: number;
  observacoes: string | null;
};

const categoriaLabels: Record<CategoriaCompra, string> = {
  INSUMO: 'Insumos / materiais',
  FRETE: 'Frete',
  FIXO: 'Despesas fixas',
  OUTRO: 'Outros',
};

const ComprasScreen: React.FC = () => {
  const db = useSQLiteContext();

  const hoje = new Date();
  const dataHojeISO = hoje.toISOString().slice(0, 10);

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const [dataCompraISO, setDataCompraISO] = useState(dataHojeISO);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaCompra>('INSUMO');
  const [fornecedor, setFornecedor] = useState('');
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [dataInicioISO, setDataInicioISO] = useState(
    primeiroDia.toISOString().slice(0, 10)
  );
  const [dataFimISO, setDataFimISO] = useState(
    ultimoDia.toISOString().slice(0, 10)
  );
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFimPicker, setShowFimPicker] = useState(false);

  const [compras, setCompras] = useState<CompraRow[]>([]);
  const [totalCompras, setTotalCompras] = useState(0);

  function onChangeDataCompra(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setDataCompraISO(date.toISOString().slice(0, 10));
    }
  }

  function onChangeDataInicio(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowInicioPicker(false);
    if (date) {
      setDataInicioISO(date.toISOString().slice(0, 10));
    }
  }

  function onChangeDataFim(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowFimPicker(false);
    if (date) {
      setDataFimISO(date.toISOString().slice(0, 10));
    }
  }

  useEffect(() => {
    carregarCompras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarCompras() {
    if (dataFimISO < dataInicioISO) {
      Alert.alert(
        'Atenção',
        'A data final não pode ser menor que a data inicial.'
      );
      return;
    }

    try {
      const lista = await db.getAllAsync<CompraRow>(
        `
          SELECT id, data, descricao, categoria, fornecedor, valor, observacoes
          FROM compras
          WHERE data BETWEEN ? AND ?
          ORDER BY data DESC, id DESC;
        `,
        dataInicioISO,
        dataFimISO
      );

      const array = Array.isArray(lista) ? lista.filter(Boolean) : [];
      setCompras(array);

      const total = array.reduce((acc, c) => acc + (c.valor || 0), 0);
      setTotalCompras(total);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as compras.');
    }
  }

  async function salvarCompra() {
    const v = parseFloat(valor.replace(',', '.')) || 0;

    if (!descricao || v <= 0) {
      Alert.alert(
        'Atenção',
        'Preencha pelo menos descrição e valor maior que zero.'
      );
      return;
    }

    try {
      await db.runAsync(
        `
          INSERT INTO compras (data, descricao, categoria, fornecedor, valor, observacoes)
          VALUES (?, ?, ?, ?, ?, ?);
        `,
        dataCompraISO,
        descricao,
        categoria,
        fornecedor || null,
        v,
        observacoes || null
      );

      setDescricao('');
      setCategoria('INSUMO');
      setFornecedor('');
      setValor('');
      setObservacoes('');
      setDataCompraISO(dataHojeISO);

      Alert.alert('Sucesso', 'Compra registrada!');
      await carregarCompras();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a compra.');
    }
  }

  async function excluirCompra(id: number) {
    Alert.alert('Confirmar', 'Deseja realmente excluir esta compra?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync('DELETE FROM compras WHERE id = ?;', id);
            await carregarCompras();
          } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível excluir a compra.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader titulo="Compras e Despesas" />

        {/* NOVA COMPRA */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="cart-arrow-down"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Registrar compra</Text>
          </View>

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Ex: 1kg de resina, MDF, etc."
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.tipoLinha}>
            {(['INSUMO', 'FRETE', 'FIXO', 'OUTRO'] as CategoriaCompra[]).map(
              (cat) => (
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
                      styles.tipoTexto,
                      categoria === cat && styles.tipoTextoAtivo,
                    ]}
                  >
                    {categoriaLabels[cat]}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.label}>Data da compra</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataCompraISO)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Fornecedor (opcional)</Text>
          <TextInput
            style={styles.input}
            value={fornecedor}
            onChangeText={setFornecedor}
            placeholder="Ex: Fornecedor XYZ"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Valor da compra (R$)</Text>
          <TextInput
            style={styles.input}
            value={valor}
            onChangeText={setValor}
            keyboardType="numeric"
            placeholder="Ex: 150"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Observações (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            placeholder="Ex: Lote de promoção, frete incluso, etc."
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.botao} onPress={salvarCompra}>
            <MaterialCommunityIcons
              name="content-save-outline"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Salvar compra</Text>
          </TouchableOpacity>
        </View>

        {/* FILTRO E RESUMO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="calendar-range"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Período de análise</Text>
          </View>

          <Text style={styles.label}>Data inicial</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowInicioPicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-start"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataInicioISO)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Data final</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowFimPicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-end"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataFimISO)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={carregarCompras}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color="#4e9bff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoSecundarioTexto}>
              Atualizar lista
            </Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Total de compras/despesas no período: R$ {totalCompras.toFixed(2)}
          </Text>
        </View>

        {/* LISTA DE COMPRAS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Compras no período</Text>
          </View>

          {(!Array.isArray(compras) || compras.length === 0) && (
            <Text style={styles.label}>
              Nenhuma compra encontrada nesse período.
            </Text>
          )}

          {Array.isArray(compras) &&
            compras.filter(Boolean).map((c) => (
              <View key={c.id} style={styles.orcItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orcItemText}>{c.descricao}</Text>
                  <Text style={styles.orcItemSubText}>
                    {formatDateToBR(c.data)} • {categoriaLabels[c.categoria]} •
                    Valor: R$ {c.valor.toFixed(2)}
                    {c.fornecedor ? ` • Forn.: ${c.fornecedor}` : ''}
                  </Text>
                  {c.observacoes ? (
                    <Text style={styles.orcItemSubText}>
                      Obs: {c.observacoes}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity onPress={() => excluirCompra(c.id)}>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color="#ff6666"
                  />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(dataCompraISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDataCompra}
        />
      )}

      {showInicioPicker && (
        <DateTimePicker
          value={new Date(dataInicioISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDataInicio}
        />
      )}

      {showFimPicker && (
        <DateTimePicker
          value={new Date(dataFimISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDataFim}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ComprasScreen;
