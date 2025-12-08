// src/screens/StatusVendasScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import  styles  from '../styles';

type FiltroStatus = 'todas' | 'feita' | 'pronta' | 'paga' | 'entregue';

type VendaRow = {
  id: number;
  cliente?: string | null;
  descricao?: string | null;
  valor?: number | null;
  data?: string | null;
  status?: string | null;
};

type Venda = {
  id: number;
  cliente: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
};

const StatusVendasScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');

  // modal de confirmação
  const [modalVisivel, setModalVisivel] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [statusDestino, setStatusDestino] = useState<string>('entregue');
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  
  const carregaVendas = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await db.getAllAsync<Venda>(
        'SELECT * FROM vendas ORDER BY id;'
      );
      setVendas(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        if (!ativo) return;
        await carregaVendas();
      })();

      // cleanup: se sair da tela antes de terminar, evita setState
      return () => {
        ativo = false;
      };
    }, [])
  );
  /**
   * Garante que a coluna "status" exista na tabela vendas.
   * Se não existir, cria com DEFAULT 'feita'.
   */
  const garantirColunaStatus = async () => {
    try {
      const colunas = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(vendas);'
      );

      const temStatus = colunas.some((c) => c.name === 'status');

      if (!temStatus) {
        await db.execAsync(
          `ALTER TABLE vendas ADD COLUMN status TEXT DEFAULT 'feita';`
        );
      }
    } catch (error) {
      console.log('Erro ao garantir coluna status em vendas:', error);
    }
  };

  const carregarVendas = async () => {
    try {
      setCarregando(true);

      // garante que a coluna exista antes de consultar
      await garantirColunaStatus();

      const rows = await db.getAllAsync<VendaRow>(
        'SELECT id, cliente, descricao, valor, data, status FROM vendas ORDER BY id DESC;'
      );

      const normalizadas: Venda[] = rows.map((r) => ({
        id: r.id,
        cliente:
          r.cliente && r.cliente.trim().length > 0
            ? r.cliente
            : `Venda #${r.id}`,
        descricao: r.descricao ?? '',
        valor: r.valor ?? 0,
        data: r.data ?? '',
        status: (r.status ?? 'feita') as string,
      }));

      setVendas(normalizadas);
    } catch (error) {
      console.log('Erro ao carregar vendas para status:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalConfirmacao = (venda: Venda, novoStatus: string) => {
    if (venda.status === 'entregue') {
      Alert.alert(
        'Ação bloqueada',
        'Esta venda já está como ENTREGUE e não pode mais ser alterada.'
      );
      return;
    }

    setVendaSelecionada(venda);
    setStatusDestino(novoStatus);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setVendaSelecionada(null);
    setStatusDestino('entregue');
  };

  const confirmarStatus = async () => {
    if (!vendaSelecionada) return;

    try {
      setAlterandoStatus(true);
      await db.runAsync('UPDATE vendas SET status = ? WHERE id = ?;', [
        statusDestino,
        vendaSelecionada.id,
      ]);
      fecharModal();
      await carregarVendas();
    } catch (error) {
      console.log('Erro ao atualizar status da venda:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status da venda.');
    } finally {
      setAlterandoStatus(false);
    }
  };

  const filtrarVendas = (): Venda[] => {
    if (filtroStatus === 'todas') return vendas;
    return vendas.filter((v) => v.status === filtroStatus);
  };

  const getStatusLabel = (status: string) => {
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'feita':
        return [styles.statusBadge, styles.statusBadgeFeita];
      case 'pronta':
        return [styles.statusBadge, styles.statusBadgePronta];
      case 'paga':
        return [styles.statusBadge, styles.statusBadgePaga];
      case 'entregue':
        return [styles.statusBadge, styles.statusBadgeEntregue];
      default:
        return [styles.statusBadge];
    }
  };

  const getStatusActionLabel = (status: string) => {
    switch (status) {
      case 'pronta':
        return 'Marcar pronta';
      case 'paga':
        return 'Marcar paga';
      case 'entregue':
        return 'Marcar entregue';
      default:
        return 'Atualizar';
    }
  };

  const formatarMoeda = (valor: number) =>
    `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;

  const vendasFiltradas = filtrarVendas();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView>
          <AppHeader titulo="Status das vendas" />

          {/* Filtros por status */}
          <View style={styles.card}>
            <Text style={styles.label}>Filtrar por status</Text>
            <View style={styles.tipoLinha}>
              {(['todas', 'feita', 'pronta', 'paga', 'entregue'] as FiltroStatus[]).map(
                (st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusFiltroChip,
                      filtroStatus === st && styles.statusFiltroChipAtivo,
                    ]}
                    onPress={() => setFiltroStatus(st)}
                  >
                    <Text
                      style={[
                        styles.statusFiltroTexto,
                        filtroStatus === st && styles.statusFiltroTextoAtivo,
                      ]}
                    >
                      {st === 'todas'
                        ? 'Todas'
                        : st === 'feita'
                        ? 'Feitas'
                        : st === 'pronta'
                        ? 'Prontas'
                        : st === 'paga'
                        ? 'Pagas'
                        : 'Entregues'}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Lista de vendas */}
          <View style={styles.card}>
            <View style={styles.cardHeaderLinha}>
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={20}
                color="#4e9bff"
              />
              <Text style={styles.cardTitulo}>Vendas registradas</Text>
            </View>

            {carregando ? (
              <ActivityIndicator size="small" color="#4e9bff" />
            ) : vendasFiltradas.length === 0 ? (
              <Text style={styles.listaVaziaTexto}>
                Nenhuma venda encontrada com este filtro.
              </Text>
            ) : (
              vendasFiltradas.map((venda) => (
                <View key={venda.id} style={styles.vendaItem}>
                  <View style={styles.vendaLinhaSuperior}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendaCliente}>{venda.cliente}</Text>

                      {!!venda.descricao && venda.descricao.trim().length > 0 && (
                        <Text style={styles.vendaDescricao}>
                          {venda.descricao}
                        </Text>
                      )}

                      <Text style={styles.vendaDataValor}>
                        {venda.data} · {formatarMoeda(venda.valor)}
                      </Text>
                    </View>

                    <View style={getStatusBadgeStyle(venda.status)}>
                      <Text style={styles.statusBadgeTexto}>
                        {getStatusLabel(venda.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Ações de status */}
                  {venda.status === 'entregue' ? (
                    <Text style={styles.vendaStatusFinalTexto}>
                      Esta venda já foi entregue. O status não pode mais ser
                      alterado.
                    </Text>
                  ) : (
                    <View style={styles.statusActionsRow}>
                      {(['pronta', 'paga', 'entregue'] as const).map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={styles.statusActionButton}
                          onPress={() => abrirModalConfirmacao(venda, st)}
                        >
                          <Text style={styles.statusActionButtonText}>
                            {getStatusActionLabel(st)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </FadeInView>
      </ScrollView>

      {/* Modal de confirmação */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar mudança de status</Text>

            <Text style={styles.modalMessage}>
              Tem certeza que deseja definir esta venda como{' '}
              <Text style={styles.modalStatusHighlight}>
                {getStatusLabel(statusDestino).toUpperCase()}
              </Text>
              ? Essa ação não poderá ser desfeita.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModal}
                disabled={alterandoStatus}
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
                onPress={confirmarStatus}
                disabled={alterandoStatus}
              >
                <Text style={styles.modalButtonText}>
                  {alterandoStatus ? 'Atualizando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StatusVendasScreen;
function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

