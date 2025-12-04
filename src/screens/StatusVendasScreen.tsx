// src/screens/StatusVendasScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type StatusVenda = 'feita' | 'pronta' | 'paga' | 'entregue';

type VendaRow = {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  lucro: number;
  status: StatusVenda;
  cliente?: string | null;
};

type ItemVendaRow = {
  id: number;
  descricao: string;
  tipo: string;
  valor: number;
  custo: number;
};

type FiltroStatus = 'todas' | StatusVenda;

const statusLabel = (status: StatusVenda): string => {
  switch (status) {
    case 'feita':
      return 'Feita';
    case 'pronta':
      return 'Pronta';
    case 'paga':
      return 'Paga';
    case 'entregue':
      return 'Entregue';
    default:
      return status;
  }
};

const StatusVendasScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');

  // modal de alteração de status
  const [modalStatusVisivel, setModalStatusVisivel] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaRow | null>(
    null
  );
  const [novoStatus, setNovoStatus] = useState<StatusVenda | null>(null);

  // modal de detalhes
  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);
  const [itensVenda, setItensVenda] = useState<ItemVendaRow[]>([]);

  const formatMoney = (v: number) =>
    `R$ ${v.toFixed(2).replace('.', ',')}`;

  const carregarVendas = async () => {
    try {
      setCarregando(true);

      const lista = await db.getAllAsync<VendaRow>(
        `
          SELECT 
            id, 
            data, 
            descricao, 
            valor, 
            lucro, 
            status, 
            cliente
          FROM vendas
          ORDER BY id DESC;
        `
      );

      setVendas(Array.isArray(lista) ? lista.filter(Boolean) : []);
    } catch (error) {
      console.log('Erro ao carregar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarVendas();
  }, []);

  const vendasFiltradas = vendas.filter((v) =>
    filtroStatus === 'todas' ? true : v.status === filtroStatus
  );

  // -------------------------------
  // MUDANÇA DE STATUS
  // -------------------------------
  const solicitarMudancaStatus = (venda: VendaRow, status: StatusVenda) => {
    if (venda.status === 'entregue') {
      Alert.alert(
        'Não é possível alterar',
        'Esta venda já está marcada como ENTREGUE e não pode mais ser alterada.'
      );
      return;
    }

    if (status === venda.status) {
      return;
    }

    setVendaSelecionada(venda);
    setNovoStatus(status);
    setModalStatusVisivel(true);
  };

  const fecharModalStatus = () => {
    setModalStatusVisivel(false);
    setVendaSelecionada(null);
    setNovoStatus(null);
  };

  const confirmarMudancaStatus = async () => {
    if (!vendaSelecionada || !novoStatus) return;

    try {
      // mensagem extra se for ENTREGUE
      if (novoStatus === 'entregue') {
        // já teve o modal anterior avisando que é irreversível
        // aqui só aplica
      }

      await db.runAsync(
        `
          UPDATE vendas
          SET status = ?
          WHERE id = ?;
        `,
        [novoStatus, vendaSelecionada.id]
      );

      fecharModalStatus();
      await carregarVendas();
      Alert.alert('Sucesso', 'Status da venda atualizado.');
    } catch (error) {
      console.log('Erro ao atualizar status da venda:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  // -------------------------------
  // DETALHES DA VENDA (itens)
  // -------------------------------
  const abrirDetalhesVenda = async (venda: VendaRow) => {
    try {
      setVendaSelecionada(venda);

      const itens = await db.getAllAsync<ItemVendaRow>(
        `
          SELECT id, descricao, tipo, valor, custo
          FROM venda_itens
          WHERE venda_id = ?;
        `,
        [venda.id]
      );

      setItensVenda(Array.isArray(itens) ? itens.filter(Boolean) : []);
      setModalDetalhesVisivel(true);
    } catch (error) {
      console.log('Erro ao carregar itens da venda:', error);
      Alert.alert('Erro', 'Não foi possível carregar os itens desta venda.');
    }
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesVisivel(false);
    setItensVenda([]);
    setVendaSelecionada(null);
  };

  const getStatusBadgeStyle = (status: StatusVenda) => {
    switch (status) {
      case 'feita':
        return styles.statusBadgeFeita;
      case 'pronta':
        return styles.statusBadgePronta;
      case 'paga':
        return styles.statusBadgePaga;
      case 'entregue':
        return styles.statusBadgeEntregue;
      default:
        return null;
    }
  };

  const getStatusBadgeText = (status: StatusVenda) => statusLabel(status);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView>
          <AppHeader titulo="Status das Vendas" />

          {/* FILTRO POR STATUS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Filtrar por status</Text>
            <View style={styles.filtroLinha}>
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'feita', label: 'Feita' },
                  { id: 'pronta', label: 'Pronta' },
                  { id: 'paga', label: 'Paga' },
                  { id: 'entregue', label: 'Entregue' },
                ] as { id: FiltroStatus; label: string }[]
              ).map((f) => {
                const ativo = filtroStatus === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.statusFiltroChip,
                      ativo && styles.statusFiltroChipAtivo,
                    ]}
                    onPress={() => setFiltroStatus(f.id)}
                  >
                    <Text
                      style={[
                        styles.statusFiltroTexto,
                        ativo && styles.statusFiltroTextoAtivo,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.botaoSecundario, { marginTop: 8 }]}
              onPress={carregarVendas}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoSecundarioTexto}>
                {carregando ? 'Atualizando...' : 'Consultar vendas'}
              </Text>
            </TouchableOpacity>

            {vendasFiltradas.length === 0 && !carregando && (
              <Text style={styles.listaVaziaTexto}>
                Nenhuma venda encontrada para este filtro.
              </Text>
            )}
          </View>

          {/* LISTA DE VENDAS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vendas</Text>

            {vendasFiltradas.map((venda) => (
              <TouchableOpacity
                key={venda.id}
                style={styles.vendaItem}
                activeOpacity={0.8}
                onPress={() => abrirDetalhesVenda(venda)}
              >
                <View style={styles.vendaLinhaSuperior}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.vendaCliente}>
                      {venda.cliente?.trim() || 'Cliente não informado'}
                    </Text>
                    <Text style={styles.vendaDescricao}>
                      {venda.descricao}
                    </Text>
                    <Text style={styles.vendaDataValor}>
                      Data: {venda.data} • Valor: {formatMoney(venda.valor)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusBadgeStyle(venda.status),
                      ]}
                    >
                      <Text style={styles.statusBadgeTexto}>
                        {getStatusBadgeText(venda.status)}
                      </Text>
                    </View>

                    <Text style={[styles.vendaDataValor, { marginTop: 4 }]}>
                      Lucro: {formatMoney(venda.lucro)}
                    </Text>
                  </View>
                </View>

                {/* AÇÕES DE STATUS */}
                <View style={styles.statusActionsRow}>
                  {(['feita', 'pronta', 'paga', 'entregue'] as StatusVenda[]).map(
                    (s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.statusActionButton}
                        onPress={() => solicitarMudancaStatus(venda, s)}
                      >
                        <Text style={styles.statusActionButtonText}>
                          {statusLabel(s)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={styles.vendaStatusFinalTexto}>
                  Toque na venda para ver os itens cadastrados.
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO DE STATUS */}
      <Modal
        visible={modalStatusVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModalStatus}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar alteração</Text>

            {vendaSelecionada && novoStatus && (
              <>
                <Text style={styles.modalMessage}>
                  Deseja realmente alterar o status da venda{' '}
                  <Text style={styles.modalStatusHighlight}>
                    #{vendaSelecionada.id}
                  </Text>{' '}
                  para{' '}
                  <Text style={styles.modalStatusHighlight}>
                    {statusLabel(novoStatus)}
                  </Text>
                  ?
                </Text>

                {novoStatus === 'entregue' && (
                  <Text style={styles.modalMessage}>
                    <Text style={styles.modalStatusHighlight}>
                      Atenção:{' '}
                    </Text>
                    ao marcar como ENTREGUE, esta venda não poderá mais ter o
                    status alterado.
                  </Text>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModalStatus}
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
                onPress={confirmarMudancaStatus}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE DETALHES DA VENDA */}
      <Modal
        visible={modalDetalhesVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModalDetalhes}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {vendaSelecionada && (
              <>
                <Text style={styles.modalTitle}>
                  Detalhes da venda #{vendaSelecionada.id}
                </Text>

                <Text style={styles.modalMessage}>
                  Cliente:{' '}
                  <Text style={styles.modalStatusHighlight}>
                    {vendaSelecionada.cliente?.trim() ||
                      'Não informado'}
                  </Text>
                </Text>
                <Text style={styles.modalMessage}>
                  Data: {vendaSelecionada.data}
                </Text>
                <Text style={styles.modalMessage}>
                  Status:{' '}
                  <Text style={styles.modalStatusHighlight}>
                    {statusLabel(vendaSelecionada.status)}
                  </Text>
                </Text>
                <Text style={styles.modalMessage}>
                  Valor total:{' '}
                  <Text style={styles.modalStatusHighlight}>
                    {formatMoney(vendaSelecionada.valor)}
                  </Text>
                </Text>
                <Text style={styles.modalMessage}>
                  Lucro total:{' '}
                  <Text style={styles.modalStatusHighlight}>
                    {formatMoney(vendaSelecionada.lucro)}
                  </Text>
                </Text>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Itens da venda</Text>
                  {itensVenda.length === 0 ? (
                    <Text style={styles.listaVaziaTexto}>
                      Nenhum item registrado para esta venda.
                    </Text>
                  ) : (
                    itensVenda.map((item) => (
                      <View key={item.id} style={styles.orcItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orcItemText}>
                            {item.descricao}
                          </Text>
                          <Text style={styles.orcItemSubText}>
                            Tipo: {item.tipo} • Valor:{' '}
                            {formatMoney(item.valor)} • Custo:{' '}
                            {formatMoney(item.custo)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={fecharModalDetalhes}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StatusVendasScreen;
