// src/screens/ClientesScreen.tsx
import React, {
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const ClientesScreen: React.FC = () => {
  const { db, lojaConfig} = useContext(DbContext)!;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const carregarClientes = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      const rows = await db.getAllAsync<Cliente>(
        'SELECT * FROM clientes ORDER BY nome;'
      );
      setClientes(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [carregarClientes])
  );

  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setObservacoes('');
  };

  const salvarCliente = async () => {
    if (!db) return;
    if (!nome.trim()) return;

    try {
      await db.runAsync(
        'INSERT INTO clientes (nome, telefone, observacoes) VALUES (?, ?, ?);',
        [nome.trim(), telefone.trim() || null, observacoes.trim() || null]
      );

      limparFormulario();
      setModalVisivel(false);
      await carregarClientes();
    } catch (error) {
      console.log('Erro ao salvar cliente', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* HEADER COM LOGO */}
          <AppHeader
          titulo="Clientes"
          logoUri={lojaConfig?.logoUri ?? undefined}
        />

          {/* CARD LISTA DE CLIENTES */}
          <View style={styles.card}>
            <View style={styles.cardHeaderLinha}>
              <MaterialCommunityIcons
                name="account-group"
                size={22}
                color={COLORS.primary}
              />
            </View>

            {/* Botão único: Novo cliente */}
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={styles.botaoPrimario}
                onPress={() => setModalVisivel(true)}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={18}
                  color={COLORS.primaryText}
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoPrimarioTexto}>Novo cliente</Text>
              </TouchableOpacity>
            </View>

            {/* Lista */}
            {loading ? (
              <View style={{ marginTop: 16 }}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : clientes.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhum cliente cadastrado ainda.
              </Text>
            ) : (
              <View style={{ marginTop: 12 }}>
                {clientes.map((cliente) => (
                  <View key={cliente.id} style={styles.clienteRow}>
                    <View style={styles.clienteIconWrapper}>
                      <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={26}
                        color="#9ca3af"
                      />
                    </View>

                    <View style={styles.clienteInfo}>
                      <Text style={styles.clienteNome}>{cliente.nome}</Text>

                      {cliente.telefone ? (
                        <Text style={styles.clienteTelefone}>
                          {cliente.telefone}
                        </Text>
                      ) : null}

                      {cliente.observacoes ? (
                        <Text style={styles.clienteObservacoes}>
                          {cliente.observacoes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* MODAL NOVO CLIENTE */}
        <Modal
          transparent
          visible={modalVisivel}
          animationType="fade"
          onRequestClose={() => {
            setModalVisivel(false);
            limparFormulario();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo cliente</Text>

              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Digite o nome"
                placeholderTextColor="#6b7280"
                value={nome}
                onChangeText={setNome}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Telefone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={setTelefone}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>
                Observações
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { height: 80, textAlignVertical: 'top' },
                ]}
                placeholder="Anote detalhes importantes do cliente"
                placeholderTextColor="#6b7280"
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />

              <View style={styles.modalBotoesLinha}>
                <TouchableOpacity
                  style={[styles.modalBotao, styles.modalBotaoCancelar]}
                  onPress={() => {
                    setModalVisivel(false);
                    limparFormulario();
                  }}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextCancel,
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                  onPress={salvarCliente}
                >
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ClientesScreen;
