// src/screens/VendasScreen.tsx
// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type TipoVenda = 'LASER' | '3D' | 'OUTRO';

type ItemVenda = {
  id: number;
  descricao: string;
  tipo: TipoVenda;
  valor: number;
  custo: number;
};

type ClienteRow = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const formatDateBR = (d: Date): string => {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

const parseMoney = (txt: string): number => {
  const clean = txt.replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
};

const VendasScreen: React.FC = () => {
  const db = useSQLiteContext();

  // Cliente
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clientesModalVisivel, setClientesModalVisivel] = useState(false);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');

  // Venda / itens
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [mostraDatePicker, setMostraDatePicker] = useState(false);

  const [descricaoItem, setDescricaoItem] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoVenda>('LASER');
  const [valorItem, setValorItem] = useState('');
  const [custoItem, setCustoItem] = useState('');

  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [contadorItemId, setContadorItemId] = useState(1);

  const [salvando, setSalvando] = useState(false);

  // -----------------------------
  // CLIENTES: salvar e selecionar
  // -----------------------------
  const carregarClientes = async (filtro: string = '') => {
    try {
      const like = `%${filtro.trim()}%`;
      const lista = await db.getAllAsync<ClienteRow>(
        `
          SELECT id, nome, telefone, observacoes
          FROM clientes
          WHERE nome LIKE ?
          ORDER BY nome ASC;
        `,
        [like]
      );

      setClientes(Array.isArray(lista) ? lista.filter(Boolean) : []);
    } catch (error) {
      console.log('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os clientes.');
    }
  };

  const salvarClienteRapido = async () => {
    const nome = clienteNome.trim();
    const telefone = clienteTelefone.trim() || null;

    if (!nome) {
      Alert.alert('Atenção', 'Informe pelo menos o nome do cliente.');
      return;
    }

    try {
      // evita duplicar nome de cliente
      const existentes = await db.getAllAsync<{ id: number }>(
        `
          SELECT id FROM clientes
          WHERE nome = ?
          LIMIT 1;
        `,
        [nome]
      );

      if (existentes.length > 0) {
        Alert.alert('Aviso', 'Este cliente já está cadastrado.');
        return;
      }

      await db.runAsync(
        `
          INSERT INTO clientes (nome, telefone)
          VALUES (?, ?);
        `,
        [nome, telefone]
      );

      Alert.alert('Sucesso', 'Cliente salvo com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    }
  };

  const abrirModalClientes = async () => {
    setBuscaCliente('');
    await carregarClientes('');
    setClientesModalVisivel(true);
  };

  const fecharModalClientes = () => {
    setClientesModalVisivel(false);
  };

  const selecionarCliente = (cliente: ClienteRow) => {
    setClienteNome(cliente.nome);
    setClienteTelefone(cliente.telefone || '');
    setClientesModalVisivel(false);
  };

  // -----------------------------
  // ITENS DA VENDA
  // -----------------------------
  const adicionarItem = () => {
    const desc = descricaoItem.trim();
    const valor = parseMoney(valorItem);
    const custo = parseMoney(custoItem);

    if (!desc) {
      Alert.alert('Atenção', 'Informe a descrição do item.');
      return;
    }

    if (valor <= 0) {
      Alert.alert('Atenção', 'Informe o valor pago pelo cliente para o item.');
      return;
    }

    if (custo < 0) {
      Alert.alert('Atenção', 'Custo de produção inválido.');
      return;
    }

    const novoItem: ItemVenda = {
      id: contadorItemId,
      descricao: desc,
      tipo: tipoSelecionado,
      valor,
      custo,
    };

    setItens((prev) => [...prev, novoItem]);
    setContadorItemId((prev) => prev + 1);

    // limpa os campos do item atual
    setDescricaoItem('');
    setValorItem('');
    setCustoItem('');
  };

  const removerItem = (id: number) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const totalValor = itens.reduce((sum, i) => sum + i.valor, 0);
  const totalCusto = itens.reduce((sum, i) => sum + i.custo, 0);
  const totalLucro = totalValor - totalCusto;

  // -----------------------------
  // SALVAR VENDA
  // -----------------------------
  const salvarVenda = async () => {
    if (itens.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um item à venda.');
      return;
    }

    const dataBR = formatDateBR(dataVenda);
    const cliente = clienteNome.trim() || null;

    // descrição “resumo” da venda
    const descricaoResumo =
      itens.length === 1
        ? itens[0].descricao
        : `${itens.length} itens (ex: ${itens[0].descricao})`;

    const tipoResumo =
      itens.length === 1 ? itens[0].tipo : ('MISTO' as TipoVenda | 'MISTO');

    try {
      setSalvando(true);

      await db.withTransactionAsync(async () => {
        const result = await db.runAsync(
          `
            INSERT INTO vendas
              (data, descricao, valor, custo, lucro, tipo, status, cliente)
            VALUES (?, ?, ?, ?, ?, ?, 'feita', ?);
          `,
          [
            dataBR,
            descricaoResumo,
            totalValor,
            totalCusto,
            totalLucro,
            tipoResumo,
            cliente,
          ]
        );

        const vendaId = result.lastInsertRowId;

        for (const item of itens) {
          await db.runAsync(
            `
              INSERT INTO venda_itens
                (venda_id, descricao, tipo, valor, custo)
              VALUES (?, ?, ?, ?, ?);
            `,
            [vendaId, item.descricao, item.tipo, item.valor, item.custo]
          );
        }
      });

      Alert.alert('Sucesso', 'Venda registrada com sucesso.');

      // reseta formulário
      setItens([]);
      setDescricaoItem('');
      setValorItem('');
      setCustoItem('');
      setTipoSelecionado('LASER');
      setDataVenda(new Date());
    } catch (error) {
      console.log('Erro ao salvar venda:', error);
      Alert.alert('Erro', 'Não foi possível salvar a venda.');
    } finally {
      setSalvando(false);
    }
  };

  // -----------------------------
  // DATE PICKER
  // -----------------------------
  const onChangeData = (_: any, selectedDate?: Date) => {
    setMostraDatePicker(false);
    if (selectedDate) {
      setDataVenda(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView>
          <AppHeader titulo="Registrar Vendas" />

          {/* CARD: CLIENTE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dados do cliente</Text>

            <Text style={styles.label}>Nome do cliente</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIconLeft}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: João da Silva"
                placeholderTextColor="#6b7280"
                value={clienteNome}
                onChangeText={setClienteNome}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Telefone (opcional)</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIconLeft}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: (99) 98400-0000"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
                value={clienteTelefone}
                onChangeText={setClienteTelefone}
              />
            </View>

            <View style={styles.clienteActionsRow}>
              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={salvarClienteRapido}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={18}
                  color="#e5e7eb"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>Salvar cliente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={abrirModalClientes}
              >
                <MaterialCommunityIcons
                  name="account-search"
                  size={18}
                  color="#e5e7eb"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>
                  Selecionar cliente
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CARD: NOVA VENDA / ITENS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nova venda</Text>

            {/* Descrição do item */}
            <Text style={styles.label}>Descrição do produto/serviço</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Totem MDF 15x20"
              placeholderTextColor="#6b7280"
              value={descricaoItem}
              onChangeText={setDescricaoItem}
            />

            {/* Tipo */}
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.tipoLinha}>
              {(['LASER', '3D', 'OUTRO'] as TipoVenda[]).map((tipo) => {
                const ativo = tipoSelecionado === tipo;
                const label =
                  tipo === 'LASER' ? 'LASER' : tipo === '3D' ? '3D' : 'OUTRO';
                const iconName =
                  tipo === 'LASER'
                    ? 'laser-pointer'
                    : tipo === '3D'
                    ? 'cube-scan'
                    : 'dots-horizontal-circle-outline';

                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoBotao,
                      ativo && styles.tipoBotaoAtivo,
                    ]}
                    onPress={() => setTipoSelecionado(tipo)}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={18}
                      color={ativo ? '#ffffff' : '#9ca3af'}
                      style={styles.botaoIcon}
                    />
                    <Text
                      style={[
                        styles.tipoBotaoTexto,
                        ativo && styles.tipoBotaoTextoAtivo,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Data */}
            <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
            <TouchableOpacity
              style={styles.inputDate}
              onPress={() => setMostraDatePicker(true)}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.inputDateText}>{formatDateBR(dataVenda)}</Text>
            </TouchableOpacity>

            {mostraDatePicker && (
              <DateTimePicker
                value={dataVenda}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeData}
              />
            )}

            {/* Valores do item */}
            <Text style={styles.label}>Valor pago pelo cliente (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 80"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={valorItem}
              onChangeText={setValorItem}
            />

            <Text style={styles.label}>Custo de produção (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 30"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={custoItem}
              onChangeText={setCustoItem}
            />

            <View style={styles.clienteActionsRow}>
              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={adicionarItem}
              >
                <MaterialCommunityIcons
                  name="plus-box-multiple"
                  size={18}
                  color="#e5e7eb"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>
                  Adicionar item
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de itens */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Itens desta venda</Text>
              {itens.length === 0 ? (
                <Text style={styles.listaVaziaTexto}>
                  Nenhum item adicionado ainda.
                </Text>
              ) : (
                itens.map((item) => (
                  <View key={item.id} style={styles.orcItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orcItemText}>{item.descricao}</Text>
                      <Text style={styles.orcItemSubText}>
                        Tipo: {item.tipo} • Valor: R${' '}
                        {item.valor.toFixed(2).replace('.', ',')} • Custo: R${' '}
                        {item.custo.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removerItem(item.id)}
                      style={styles.statusActionButton}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color="#f97373"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Resumo */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Resumo</Text>
              <Text style={styles.vendaDataValor}>
                Total recebido: R$ {totalValor.toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.vendaDataValor}>
                Custo total: R$ {totalCusto.toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.vendaDataValor}>
                Lucro: R$ {totalLucro.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            {/* Botão salvar venda */}
            <TouchableOpacity
              style={[
                styles.botaoPrimario,
                { marginTop: 16, opacity: salvando ? 0.7 : 1 },
              ]}
              onPress={salvarVenda}
              disabled={salvando}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color="#ffffff"
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoPrimarioTexto}>
                {salvando ? 'Salvando...' : 'Salvar venda'}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ScrollView>

      {/* MODAL: SELECIONAR CLIENTE */}
      <Modal
        visible={clientesModalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModalClientes}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar cliente</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Buscar por nome"
              placeholderTextColor="#9ca3af"
              value={buscaCliente}
              onChangeText={async (text) => {
                setBuscaCliente(text);
                await carregarClientes(text);
              }}
            />

            <ScrollView
              style={{ maxHeight: 260, marginTop: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              {clientes.length === 0 ? (
                <Text style={styles.listaVaziaTexto}>
                  Nenhum cliente encontrado.
                </Text>
              ) : (
                clientes.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.clienteRow}
                    onPress={() => selecionarCliente(c)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clienteNome}>{c.nome}</Text>
                      {c.telefone ? (
                        <Text style={styles.clienteTelefone}>
                          {c.telefone}
                        </Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModalClientes}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextCancel,
                  ]}
                >
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default VendasScreen;
