// src/screens/ClientesScreen.tsx
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type ClienteRow = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const ClientesScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState<ClienteRow | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

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

  useEffect(() => {
    carregarClientes('');
  }, []);

  const abrirNovoCliente = () => {
    setEditando(null);
    setNome('');
    setTelefone('');
    setObservacoes('');
    setModalVisivel(true);
  };

  const abrirEditarCliente = (cliente: ClienteRow) => {
    setEditando(cliente);
    setNome(cliente.nome);
    setTelefone(cliente.telefone || '');
    setObservacoes(cliente.observacoes || '');
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
  };

  const salvarCliente = async () => {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }

    const tel = telefone.trim() || null;
    const obs = observacoes.trim() || null;

    try {
      if (editando) {
        await db.runAsync(
          `
            UPDATE clientes
               SET nome = ?, telefone = ?, observacoes = ?
             WHERE id = ?;
          `,
          [nomeTrim, tel, obs, editando.id]
        );
      } else {
        await db.runAsync(
          `
            INSERT INTO clientes (nome, telefone, observacoes)
            VALUES (?, ?, ?);
          `,
          [nomeTrim, tel, obs]
        );
      }

      await carregarClientes(busca);
      setModalVisivel(false);
    } catch (error) {
      console.log('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    }
  };

  const excluirCliente = async (cliente: ClienteRow) => {
    Alert.alert(
      'Excluir cliente',
      `Tem certeza que deseja excluir o cliente "${cliente.nome}"?\nEssa ação não remove as vendas já registradas, apenas o cadastro do cliente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(
                `
                  DELETE FROM clientes
                   WHERE id = ?;
                `,
                [cliente.id]
              );
              await carregarClientes(busca);
            } catch (error) {
              console.log('Erro ao excluir cliente:', error);
              Alert.alert('Erro', 'Não foi possível excluir o cliente.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <FadeInView>
        <AppHeader titulo="Clientes" />

        {/* CARD DE CONTROLE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Gerenciar clientes</Text>
          <Text style={styles.vendaDataValor}>
            Total cadastrados:{' '}
            <Text style={styles.valorDestaque}>{clientes.length}</Text>
          </Text>

          <Text style={[styles.label, { marginTop: 8 }]}>Buscar</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Digite parte do nome"
            placeholderTextColor="#9ca3af"
            value={busca}
            onChangeText={async (texto) => {
              setBusca(texto);
              await carregarClientes(texto);
            }}
          />

          <TouchableOpacity
            style={[styles.botaoPrimario, { marginTop: 10 }]}
            onPress={abrirNovoCliente}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={20}
              color="#ffffff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoPrimarioTexto}>Novo cliente</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE CLIENTES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lista de clientes</Text>

          {clientes.length === 0 ? (
            <Text style={styles.listaVaziaTexto}>
              Nenhum cliente cadastrado ainda.
            </Text>
          ) : (
            clientes.map((c) => (
              <View key={c.id} style={styles.clienteRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clienteNome}>{c.nome}</Text>
                  {c.telefone ? (
                    <Text style={styles.clienteTelefone}>{c.telefone}</Text>
                  ) : null}
                  {c.observacoes ? (
                    <Text style={styles.clienteTelefone}>{c.observacoes}</Text>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => abrirEditarCliente(c)}
                    style={styles.statusActionButton}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={18}
                      color="#60a5fa"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => excluirCliente(c)}
                    style={styles.statusActionButton}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#f97373"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </FadeInView>

      {/* MODAL NOVO/EDITAR CLIENTE */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando ? 'Editar cliente' : 'Novo cliente'}
            </Text>

            <Text style={styles.label}>Nome*</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: João da Silva"
              placeholderTextColor="#9ca3af"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={[styles.label, { marginTop: 8 }]}>
              Telefone (opcional)
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: (99) 98400-0000"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />

            <Text style={[styles.label, { marginTop: 8 }]}>
              Observações (opcional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { minHeight: 80, textAlignVertical: 'top' },
              ]}
              placeholder="Ex: Cliente prefere contato por WhatsApp…"
              placeholderTextColor="#9ca3af"
              multiline
              value={observacoes}
              onChangeText={setObservacoes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModal}
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
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={salvarCliente}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ClientesScreen;
