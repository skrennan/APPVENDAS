// src/screens/ClientesScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import  styles, { COLORS }  from '../styles';
import AppHeader from '../components/AppHeader';
import { db } from '../utils';

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const ClientesScreen: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // --------------------------------------------------
  // Carregar clientes do banco
  // --------------------------------------------------
  const carregarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await db.getAllAsync<Cliente>(
        'SELECT * FROM clientes ORDER BY nome;'
      );
      setClientes(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        if (!ativo) return;
        await carregarClientes();
      })();

      return () => {
        ativo = false;
      };
    }, [carregarClientes])
  );

  // --------------------------------------------------
  // Ações do modal
  // --------------------------------------------------
  const abrirModalNovo = () => {
    setEditando(null);
    setNome('');
    setTelefone('');
    setObservacoes('');
    setModalVisible(true);
  };

  const abrirModalEditar = (cliente: Cliente) => {
    setEditando(cliente);
    setNome(cliente.nome);
    setTelefone(cliente.telefone ?? '');
    setObservacoes(cliente.observacoes ?? '');
    setModalVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
  };

  const salvarCliente = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }

    try {
      if (editando?.id) {
        await db.runAsync(
          'UPDATE clientes SET nome = ?, telefone = ?, observacoes = ? WHERE id = ?',
          [nome.trim(), telefone || null, observacoes || null, editando.id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO clientes (nome, telefone, observacoes) VALUES (?, ?, ?)',
          [nome.trim(), telefone || null, observacoes || null]
        );
      }

      fecharModal();
      await carregarClientes();
    } catch (error) {
      console.log('Erro ao salvar cliente', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    }
  };

  const excluirCliente = (cliente: Cliente) => {
    if (!cliente.id) return;

    Alert.alert(
      'Excluir cliente',
      `Deseja realmente excluir o cliente "${cliente.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM clientes WHERE id = ?', [
                cliente.id,
              ]);
              await carregarClientes();
            } catch (error) {
              console.log('Erro ao excluir cliente', error);
              Alert.alert('Erro', 'Não foi possível excluir o cliente.');
            }
          },
        },
      ]
    );
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <View style={styles.container}>
      <AppHeader titulo="Clientes" />

      <ScrollView contentContainerStyle={styles.scroll}>
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>Clientes</Text>

    <View style={styles.clienteActionsRow}>
      <TouchableOpacity
        style={[styles.botaoSecundario, { flex: 1 }]}
        onPress={carregarClientes}
      >
        <MaterialCommunityIcons
          name="refresh"
          size={18}
          color={COLORS.primaryText}
          style={styles.botaoIcon}
        />
        <Text style={styles.botaoSecundarioTexto}>Recarregar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botaoPrimario, { flex: 1 }]}
        onPress={() => setModalVisible(true)}
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

    {/* lista / empty */}
    {clientes.length === 0 ? (
      <Text style={styles.emptyText}>Nenhum cliente cadastrado ainda.</Text>
    ) : (
      clientes.map((cliente) => (
        <View key={cliente.id} style={styles.clienteRow}>
          <View style={styles.clienteIconWrapper}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color="#9ca3af"
            />
          </View>

          <View style={styles.clienteInfo}>
            <Text style={styles.clienteNome}>{cliente.nome}</Text>
            {cliente.telefone ? (
              <Text style={styles.clienteTelefone}>{cliente.telefone}</Text>
            ) : null}
            {cliente.observacoes ? (
              <Text style={styles.clienteObservacoes}>
                {cliente.observacoes}
              </Text>
            ) : null}
          </View>
        </View>
      ))
    )}
  </View>
</ScrollView>


      {/* MODAL CADASTRO / EDIÇÃO */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando ? 'Editar cliente' : 'Novo cliente'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nome do cliente"
              placeholderTextColor="#6b7280"
              value={nome}
              onChangeText={setNome}
            />

            <View style={{ height: 10 }} />

            <TextInput
              style={styles.modalInput}
              placeholder="Telefone (opcional)"
              placeholderTextColor="#6b7280"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            <View style={{ height: 10 }} />

            <TextInput
              style={[
                styles.modalInput,
                { height: 80, textAlignVertical: 'top' },
              ]}
              placeholder="Observações (opcional)"
              placeholderTextColor="#6b7280"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModal}
              >
                <Text
                  style={[styles.modalButtonText, styles.modalButtonTextCancel]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={salvarCliente}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ClientesScreen;
