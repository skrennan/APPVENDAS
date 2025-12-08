// src/screens/VendasScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import  styles  from '../styles';
import { formatDateToBR, TipoVenda, tipoIcones } from '../utils';
import  AppHeader  from '../components/AppHeader';

const VendasScreen: React.FC = () => {
  const db = useSQLiteContext();

  const hoje = new Date();
  const dataHojeISO = hoje.toISOString().slice(0, 10);

  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<TipoVenda>('LASER');
  const [valor, setValor] = useState('');
  const [custo, setCusto] = useState('');
  const [dataVendaISO, setDataVendaISO] = useState(dataHojeISO);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [previewValor, setPreviewValor] = useState(0);
  const [previewCusto, setPreviewCusto] = useState(0);
  const [previewLucro, setPreviewLucro] = useState(0);

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      const iso = date.toISOString().slice(0, 10);
      setDataVendaISO(iso);
    }
  }

  function validarVendaCampos():
    | { v: number; c: number; lucro: number; dataISO: string }
    | null {
    const v = parseFloat(valor.replace(',', '.')) || 0;
    const c = parseFloat(custo.replace(',', '.')) || 0;

    if (!descricao || v <= 0) {
      Alert.alert('Atenção', 'Preencha ao menos descrição e valor.');
      return null;
    }

    const dataISO = dataVendaISO || dataHojeISO;
    const lucro = v - c;
    return { v, c, lucro, dataISO };
  }

  function abrirConfirmacaoVenda() {
    const result = validarVendaCampos();
    if (!result) return;

    setPreviewValor(result.v);
    setPreviewCusto(result.c);
    setPreviewLucro(result.lucro);
    setConfirmVisible(true);
  }

  async function confirmarVenda() {
    const result = validarVendaCampos();
    if (!result) {
      setConfirmVisible(false);
      return;
    }

    const { v, c, lucro, dataISO } = result;

    try {
      await db.runAsync(
        `
        INSERT INTO vendas (data, descricao, tipo, valor, custo, lucro, status)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
        dataISO,
        descricao,
        tipo,
        v,
        c,
        lucro,
        'FEITA'
      );

      setDescricao('');
      setValor('');
      setCusto('');
      setTipo('LASER');
      setDataVendaISO(dataHojeISO);
      setConfirmVisible(false);

      Alert.alert('Sucesso', 'Venda registrada!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a venda.');
    }
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
        <AppHeader titulo="Registrar Vendas" />

        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="cart-plus"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Nova venda</Text>
          </View>

          <Text style={styles.label}>Descrição do produto/serviço</Text>
          <TextInput
            style={styles.input}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Ex: Totem MDF 15x20"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.tipoLinha}>
            {(['LASER', '3D', 'OUTRO'] as TipoVenda[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tipoBotao,
                  tipo === t && styles.tipoBotaoAtivo,
                ]}
                onPress={() => setTipo(t)}
              >
                <MaterialCommunityIcons
                  name={tipoIcones[t] as any}
                  size={16}
                  color={tipo === t ? '#fff' : '#aaa'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tipoTexto,
                    tipo === t && styles.tipoTextoAtivo,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataVendaISO)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Valor pago pelo cliente (R$)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
            placeholder="Ex: 80"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Custo de produção (R$)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={custo}
            onChangeText={setCusto}
            placeholder="Ex: 30"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.botao} onPress={abrirConfirmacaoVenda}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Salvar venda</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(dataVendaISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={handleDateChange}
        />
      )}

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar venda?</Text>
            <Text style={styles.modalTexto}>
              Descrição: {descricao || '-'}
            </Text>
            <Text style={styles.modalTexto}>Tipo: {tipo}</Text>
            <Text style={styles.modalTexto}>
              Data: {formatDateToBR(dataVendaISO)}
            </Text>
            <Text style={styles.modalTexto}>
              Valor: R$ {previewValor.toFixed(2)} | Custo: R${' '}
              {previewCusto.toFixed(2)}
            </Text>
            <Text style={styles.modalTexto}>
              Lucro estimado: R$ {previewLucro.toFixed(2)}
            </Text>

            <View style={styles.modalBotoesLinha}>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setConfirmVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={20}
                  color="#fff"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                onPress={confirmarVenda}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#fff"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default VendasScreen;
