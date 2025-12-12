import React, {
  useState,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import { styles, COLORS } from '../styles';
import AppHeader from '../components/AppHeader';
import SwipeTabsContainer from '../components/SwipeTabsContainer';

type TipoVenda = 'LASER' | '3D' | 'OUTRO';
type StatusVenda = 'feita' | 'pronta' | 'paga' | 'entregue';

interface Venda {
  id: number;
  data: string;
  descricao: string;
  tipo: string;
  valor: number;
  custo: number;
  lucro: number;
  status: StatusVenda;
  cliente?: string | null;
}

interface Cliente {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
}

const VendasScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  // campos da venda
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<TipoVenda>('LASER');
  const [data, setData] = useState('');
  const [valor, setValor] = useState('');
  const [custo, setCusto] = useState('');

  // clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState<string>('');

  // "mini-form" de novo cliente na própria tela
  const [mostrarNovoClienteInline, setMostrarNovoClienteInline] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoObs, setNovoObs] = useState('');

  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  // --------------------------------------------------
  // Carregar clientes
  // --------------------------------------------------
  const carregarClientes = useCallback(async () => {
    if (!db) return;
    try {
      const rows = await db.getAllAsync<Cliente>(
        'SELECT id, nome, telefone, observacoes FROM clientes ORDER BY nome;'
      );
      setClientes(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes em VendasScreen:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [carregarClientes])
  );

  // --------------------------------------------------
  // Salvar venda
  // --------------------------------------------------
  const handleSalvarVenda = async () => {
    if (!db) return;

    if (!descricao.trim() || !data.trim() || !valor.trim() || !custo.trim()) {
      // você pode colocar um Alert aqui se quiser
      return;
    }

    try {
      setSalvandoVenda(true);

      const valorNum = parseFloat(valor.replace(',', '.')) || 0;
      const custoNum = parseFloat(custo.replace(',', '.')) || 0;
      const lucro = valorNum - custoNum;

      await db.runAsync(
        `
        INSERT INTO vendas (data, descricao, tipo, valor, custo, lucro, status, cliente)
        VALUES (?, ?, ?, ?, ?, ?, 'feita', ?);
      `,
        [
          data.trim(),
          descricao.trim(),
          tipo,
          valorNum,
          custoNum,
          lucro,
          clienteSelecionadoNome || null,
        ]
      );

      setDescricao('');
      setData('');
      setValor('');
      setCusto('');
      setClienteSelecionadoNome('');
    } catch (error) {
      console.log('Erro ao salvar venda:', error);
    } finally {
      setSalvandoVenda(false);
    }
  };

  // --------------------------------------------------
  // Novo cliente inline
  // --------------------------------------------------
  const abrirNovoClienteInline = () => {
    setNovoNome('');
    setNovoTelefone('');
    setNovoObs('');
    setMostrarNovoClienteInline(true);
  };

  const cancelarNovoClienteInline = () => {
    setMostrarNovoClienteInline(false);
    setNovoNome('');
    setNovoTelefone('');
    setNovoObs('');
  };

  const handleSalvarNovoCliente = async () => {
    if (!db) return;
    if (!novoNome.trim()) {
      return;
    }

    try {
      setSalvandoCliente(true);

      await db.runAsync(
        `
        INSERT INTO clientes (nome, telefone, observacoes)
        VALUES (?, ?, ?);
      `,
        [
          novoNome.trim(),
          novoTelefone.trim() || null,
          novoObs.trim() || null,
        ]
      );

      await carregarClientes();

      setClienteSelecionadoNome(novoNome.trim());
      setMostrarNovoClienteInline(false);
      setNovoNome('');
      setNovoTelefone('');
      setNovoObs('');
    } catch (error) {
      console.log('Erro ao salvar novo cliente:', error);
    } finally {
      setSalvandoCliente(false);
    }
  };

  // --------------------------------------------------
  // Render UI helpers
  // --------------------------------------------------
  const renderTipoBotao = (valor: TipoVenda, label: string) => {
    const ativo = tipo === valor;
    return (
      <TouchableOpacity
        key={valor}
        style={[styles.tipoBotao, ativo && styles.tipoBotaoAtivo]}
        onPress={() => setTipo(valor)}
      >
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
  };

  const renderChipsClientes = () => {
    if (clientes.length === 0) {
      return (
        <Text style={styles.emptyText}>
          Nenhum cliente cadastrado ainda. Cadastre um novo abaixo.
        </Text>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {clientes.map((c) => {
          const ativo = clienteSelecionadoNome === c.nome;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.filtroBotao,
                ativo && styles.filtroBotaoAtivo,
              ]}
              onPress={() =>
                setClienteSelecionadoNome(
                  ativo ? '' : c.nome
                )
              }
            >
              <Text
                style={[
                  styles.filtroBotaoTexto,
                  ativo && styles.filtroBotaoTextoAtivo,
                ]}
              >
                {c.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SwipeTabsContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <AppHeader
          titulo="Registrar Vendas"
          logoUri={lojaConfig?.logoUri ?? undefined}
        />

            <View style={styles.card}>
              <View style={styles.cardHeaderLinha}>
                <MaterialCommunityIcons
                  name="cart-arrow-down"
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={styles.cardTitulo}>Nova venda</Text>
              </View>

              {/* Descrição */}
              <Text style={styles.label}>Descrição do produto/serviço</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="sticker-text-outline"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Ex: Totem MDF 15x20"
                  placeholderTextColor={COLORS.textMuted}
                  value={descricao}
                  onChangeText={setDescricao}
                />
              </View>

              {/* Tipo */}
              <Text style={[styles.label, { marginTop: 12 }]}>Tipo</Text>
              <View style={styles.tipoLinha}>
                {renderTipoBotao('LASER', 'Laser')}
                {renderTipoBotao('3D', 'Impressão 3D')}
                {renderTipoBotao('OUTRO', 'Outro')}
              </View>

              {/* Data */}
              <Text style={[styles.label, { marginTop: 12 }]}>
                Data (DD/MM/AAAA)
              </Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="02/12/2025"
                  placeholderTextColor={COLORS.textMuted}
                  value={data}
                  onChangeText={setData}
                />
              </View>

              {/* Valor */}
              <Text style={[styles.label, { marginTop: 12 }]}>
                Valor pago pelo cliente (R$)
              </Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Ex: 80"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={valor}
                  onChangeText={setValor}
                />
              </View>

              {/* Custo */}
              <Text style={[styles.label, { marginTop: 12 }]}>
                Custo de produção (R$)
              </Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="hammer-screwdriver"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Ex: 30"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={custo}
                  onChangeText={setCusto}
                />
              </View>

              {/* Clientes */}
              <View style={{ marginTop: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text style={styles.label}>Cliente</Text>
                  <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={
                      mostrarNovoClienteInline
                        ? cancelarNovoClienteInline
                        : abrirNovoClienteInline
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        mostrarNovoClienteInline
                          ? 'close-circle-outline'
                          : 'account-plus-outline'
                      }
                      size={18}
                      color={COLORS.text}
                      style={styles.botaoIcon}
                    />
                    <Text style={styles.botaoSecundarioTexto}>
                      {mostrarNovoClienteInline
                        ? 'Fechar cadastro'
                        : 'Novo cliente'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {renderChipsClientes()}

                {/* Mini-form de novo cliente inline */}
                {mostrarNovoClienteInline && (
                  <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.sectionTitle}>
                      Cadastrar novo cliente
                    </Text>

                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ex: Maria Cliente"
                      placeholderTextColor={COLORS.textMuted}
                      value={novoNome}
                      onChangeText={setNovoNome}
                    />

                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Telefone (opcional)
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ex: (99) 99999-9999"
                      placeholderTextColor={COLORS.textMuted}
                      value={novoTelefone}
                      onChangeText={setNovoTelefone}
                      keyboardType="phone-pad"
                    />

                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Observações (opcional)
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { height: 80 }]}
                      placeholder="Anotações sobre o cliente..."
                      placeholderTextColor={COLORS.textMuted}
                      value={novoObs}
                      onChangeText={setNovoObs}
                      multiline
                    />

                    <View style={styles.clienteActionsRow}>
                      <TouchableOpacity
                        style={styles.botaoSecundario}
                        onPress={cancelarNovoClienteInline}
                        disabled={salvandoCliente}
                      >
                        <Text style={styles.botaoSecundarioTexto}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botao}
                        onPress={handleSalvarNovoCliente}
                        disabled={salvandoCliente}
                      >
                        <Text style={styles.botaoTexto}>
                          {salvandoCliente ? 'Salvando...' : 'Salvar cliente'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Botão salvar venda */}
              <TouchableOpacity
                style={[styles.botaoPrimario, { marginTop: 20 }]}
                onPress={handleSalvarVenda}
                disabled={salvandoVenda}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={COLORS.primaryText}
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoPrimarioTexto}>
                  {salvandoVenda ? 'Salvando...' : 'Salvar venda'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SwipeTabsContainer>
  );
};

export default VendasScreen;
