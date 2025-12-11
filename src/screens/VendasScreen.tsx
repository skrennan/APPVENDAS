import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App'; // ajuste se o caminho for diferente
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type StatusVenda = 'feita' | 'pronta' | 'paga' | 'entregue';

type Venda = {
  id: number;
  data: string;
  descricao: string;
  tipo: 'LASER' | '3D' | 'OUTRO';
  valor: number;
  custo: number;
  lucro: number;
  status: StatusVenda;
  cliente?: string | null;
};

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const VendasScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<'LASER' | '3D' | 'OUTRO'>('LASER');
  const [data, setData] = useState<string>(() => {
    const hoje = new Date();
    const d = String(hoje.getDate()).padStart(2, '0');
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const a = hoje.getFullYear();
    return `${d}/${m}/${a}`;
  });
  const [valor, setValor] = useState('');
  const [custo, setCusto] = useState('');

  // clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(false);

  const valorNumber = useMemo(() => Number(String(valor).replace(',', '.')) || 0, [valor]);
  const custoNumber = useMemo(() => Number(String(custo).replace(',', '.')) || 0, [custo]);
  const lucroNumber = useMemo(() => valorNumber - custoNumber, [valorNumber, custoNumber]);

  // ------------------------------
  // Carregar clientes
  // ------------------------------
  const carregarClientes = useCallback(async () => {
    try {
      setCarregandoClientes(true);
      const rows = await db.getAllAsync<Cliente>('SELECT * FROM clientes ORDER BY nome;');
      setClientes(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes', error);
    } finally {
      setCarregandoClientes(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [carregarClientes]),
  );

  // ------------------------------
  // Salvar cliente rápido
  // ------------------------------
  const handleSalvarNovoCliente = useCallback(async () => {
    const nome = novoClienteNome.trim();
    if (!nome) {
      Alert.alert('Atenção', 'Informe ao menos o nome do cliente.');
      return;
    }

    try {
      setSalvando(true);
      const result = await db.runAsync(
        'INSERT INTO clientes (nome, telefone, observacoes) VALUES (?, ?, ?);',
        [nome, novoClienteTelefone || null, null],
      );

      const novoId = (result.lastInsertRowId as number) ?? undefined;
      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setMostrarNovoCliente(false);

      await carregarClientes();
      if (novoId) {
        setClienteSelecionado(novoId);
      }

      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar cliente rápido', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    } finally {
      setSalvando(false);
    }
  }, [db, novoClienteNome, novoClienteTelefone, carregarClientes]);

  // ------------------------------
  // Salvar venda
  // ------------------------------
  const handleSalvarVenda = useCallback(async () => {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Informe a descrição do produto/serviço.');
      return;
    }
    if (!valorNumber) {
      Alert.alert('Atenção', 'Informe o valor pago pelo cliente.');
      return;
    }

    let clienteNome: string | null = null;
    if (clienteSelecionado) {
      const cliente = clientes.find(c => c.id === clienteSelecionado);
      clienteNome = cliente?.nome ?? null;
    }

    try {
      setSalvando(true);
      await db.runAsync(
        `INSERT INTO vendas 
           (data, descricao, tipo, valor, custo, lucro, status, cliente)
         VALUES (?, ?, ?, ?, ?, ?, 'feita', ?);`,
        [data, descricao.trim(), tipo, valorNumber, custoNumber, lucroNumber, clienteNome],
      );

      setDescricao('');
      setValor('');
      setCusto('');
      setClienteSelecionado(null);
      setTipo('LASER');

      Alert.alert('Sucesso', 'Venda registrada com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar venda', error);
      Alert.alert('Erro', 'Não foi possível salvar a venda.');
    } finally {
      setSalvando(false);
    }
  }, [
    db,
    data,
    descricao,
    tipo,
    valorNumber,
    custoNumber,
    lucroNumber,
    clienteSelecionado,
    clientes,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          titulo="Registrar Vendas"
          logoUri={lojaConfig?.logoUri ?? undefined}
        />

        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="cart-plus"
              size={20}
              color={COLORS.primary}
              style={styles.botaoIcon}
            />
            <Text style={styles.cardTitulo}>Nova venda</Text>
          </View>

          {/* Descrição */}
          <Text style={styles.label}>Descrição do produto/serviço</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Totem MDF 15x20"
            placeholderTextColor={COLORS.textMuted}
            value={descricao}
            onChangeText={setDescricao}
          />

          {/* Tipo */}
          <Text style={[styles.label, { marginTop: 12 }]}>Tipo</Text>
          <View style={styles.tipoLinha}>
            {(['LASER', '3D', 'OUTRO'] as const).map(opcao => (
              <TouchableOpacity
                key={opcao}
                style={[
                  styles.tipoBotao,
                  tipo === opcao && styles.tipoBotaoAtivo,
                ]}
                onPress={() => setTipo(opcao)}
              >
                <Text
                  style={[
                    styles.tipoBotaoTexto,
                    tipo === opcao && styles.tipoBotaoTextoAtivo,
                  ]}
                >
                  {opcao === 'LASER' && '⚡ LASER'}
                  {opcao === '3D' && '🧱 3D'}
                  {opcao === 'OUTRO' && '📦 OUTRO'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Data */}
          <Text style={[styles.label, { marginTop: 12 }]}>Data (DD/MM/AAAA)</Text>
          <TextInput
            style={styles.input}
            value={data}
            onChangeText={setData}
          />

          {/* Cliente */}
          <Text style={[styles.label, { marginTop: 12 }]}>Cliente (opcional)</Text>

          {carregandoClientes ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 8 }} />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                {clientes.map(cliente => (
                  <TouchableOpacity
                    key={cliente.id}
                    onPress={() =>
                      setClienteSelecionado(prev =>
                        prev === cliente.id ? null : cliente.id,
                      )
                    }
                    style={[
                      styles.statusFiltroChip,
                      clienteSelecionado === cliente.id &&
                        styles.statusFiltroChipAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusFiltroTexto,
                        clienteSelecionado === cliente.id &&
                          styles.statusFiltroTextoAtivo,
                      ]}
                    >
                      {cliente.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => setMostrarNovoCliente(prev => !prev)}
              >
                <MaterialCommunityIcons
                  name={mostrarNovoCliente ? 'minus-circle-outline' : 'plus-circle-outline'}
                  size={18}
                  color={COLORS.primaryText}
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>
                  {mostrarNovoCliente ? 'Cancelar novo cliente' : 'Cadastrar novo cliente'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mostrarNovoCliente && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Nome do cliente</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João da Silva"
                placeholderTextColor={COLORS.textMuted}
                value={novoClienteNome}
                onChangeText={setNovoClienteNome}
              />

              <Text style={[styles.label, { marginTop: 8 }]}>Telefone (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: (99) 99999-9999"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={novoClienteTelefone}
                onChangeText={setNovoClienteTelefone}
              />

              <TouchableOpacity
                style={styles.botaoPrimario}
                onPress={handleSalvarNovoCliente}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={COLORS.primaryText} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-plus"
                      size={18}
                      color={COLORS.primaryText}
                      style={styles.botaoIcon}
                    />
                    <Text style={styles.botaoPrimarioTexto}>Salvar cliente</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Valores */}
          <Text style={[styles.label, { marginTop: 16 }]}>
            Valor pago pelo cliente (R$)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 80"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>
            Custo de produção (R$)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 30"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={custo}
            onChangeText={setCusto}
          />

          {/* Resumo rápido */}
          <Text style={[styles.resumoLinha, { marginTop: 12 }]}>
            Lucro estimado:{' '}
            <Text style={styles.resumoValor}>R$ {lucroNumber.toFixed(2)}</Text>
          </Text>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[styles.botaoPrimario, { marginTop: 18 }]}
            onPress={handleSalvarVenda}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color={COLORS.primaryText} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={COLORS.primaryText}
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoPrimarioTexto}>Salvar venda</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VendasScreen;
