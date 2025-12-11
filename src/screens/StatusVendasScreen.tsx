import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DbContext } from '../../App';
import AppHeader from '../components/AppHeader';
import { styles, COLORS } from '../styles';

type StatusVenda = 'feita' | 'pronta' | 'paga' | 'entregue';

type Venda = {
  id: number;
  data: string;
  descricao: string;
  tipo: string;
  valor: number;
  custo: number;
  lucro: number;
  status: StatusVenda;
  cliente?: string | null;
};

const statusLabel = (s: StatusVenda) => {
  switch (s) {
    case 'feita':
      return 'Feita';
    case 'pronta':
      return 'Pronta';
    case 'paga':
      return 'Paga';
    case 'entregue':
      return 'Entregue';
  }
};

const StatusVendasScreen: React.FC = () => {
  const { db, lojaConfig } = useContext(DbContext)!;

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<StatusVenda | 'todas'>('todas');

  const carregarVendas = useCallback(async () => {
    try {
      setCarregando(true);

      let query = 'SELECT * FROM vendas ORDER BY id DESC;';
      let params: any[] = [];

      if (statusFiltro !== 'todas') {
        query = 'SELECT * FROM vendas WHERE status = ? ORDER BY id DESC;';
        params = [statusFiltro];
      }

      const rows = await db.getAllAsync<Venda>(query, params);
      setVendas(rows);
    } catch (error) {
      console.log('Erro ao carregar vendas para status', error);
    } finally {
      setCarregando(false);
    }
  }, [db, statusFiltro]);

  useFocusEffect(
    useCallback(() => {
      carregarVendas();
    }, [carregarVendas]),
  );

  const handleAlterarStatus = useCallback(
    (venda: Venda, novoStatus: StatusVenda) => {
      // se já está entregue, não muda
      if (venda.status === 'entregue') {
        Alert.alert('Atenção', 'Esta venda já foi entregue e não pode ser alterada.');
        return;
      }

      // se for marcar como entregue, avisa que é irreversível
      const mensagem =
        novoStatus === 'entregue'
          ? 'Marcar como ENTREGUE é uma ação definitiva. Deseja continuar?'
          : `Tem certeza que deseja marcar esta venda como "${statusLabel(novoStatus)}"?`;

      Alert.alert(
        'Confirmar alteração',
        mensagem,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            style: 'destructive',
            onPress: async () => {
              try {
                await db.runAsync('UPDATE vendas SET status = ? WHERE id = ?;', [
                  novoStatus,
                  venda.id,
                ]);
                await carregarVendas();
              } catch (error) {
                console.log('Erro ao atualizar status da venda', error);
                Alert.alert('Erro', 'Não foi possível atualizar o status.');
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [db, carregarVendas],
  );

  const renderStatusBadge = (status: StatusVenda) => {
    const badgeStyle: any[] = [styles.statusBadge];

    switch (status) {
      case 'feita':
        badgeStyle.push(styles.statusBadgeFeita);
        break;
      case 'pronta':
        badgeStyle.push(styles.statusBadgePronta);
        break;
      case 'paga':
        badgeStyle.push(styles.statusBadgePaga);
        break;
      case 'entregue':
        badgeStyle.push(styles.statusBadgeEntregue);
        break;
    }

    return (
      <View style={badgeStyle}>
        <Text style={styles.statusBadgeTexto}>{statusLabel(status)}</Text>
      </View>
    );
  };

  const vendasFiltradas =
    statusFiltro === 'todas'
      ? vendas
      : vendas.filter(v => v.status === statusFiltro);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <AppHeader
        titulo="Status das Vendas"
        logoUri={lojaConfig?.logoUri ?? undefined}
      />

      <View style={styles.card}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Filtrar por status</Text>
        </View>

        <View style={styles.filtroLinha}>
          {(['todas', 'feita', 'pronta', 'paga', 'entregue'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusFiltroChip,
                statusFiltro === s && styles.statusFiltroChipAtivo,
              ]}
              onPress={() => setStatusFiltro(s)}
            >
              <Text
                style={[
                  styles.statusFiltroTexto,
                  statusFiltro === s && styles.statusFiltroTextoAtivo,
                ]}
              >
                {s === 'todas' ? 'Todas' : statusLabel(s as StatusVenda)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={carregarVendas}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color={COLORS.primaryText} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color={COLORS.primaryText}
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoSecundarioTexto}>Recarregar vendas</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <View style={styles.cardHeaderLinha}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={20}
            color={COLORS.primary}
            style={styles.botaoIcon}
          />
          <Text style={styles.cardTitulo}>Vendas</Text>
        </View>

        {carregando && vendas.length === 0 && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
        )}

        {vendasFiltradas.length === 0 && !carregando && (
          <Text style={styles.listaVaziaTexto}>
            Nenhuma venda encontrada para o filtro selecionado.
          </Text>
        )}

        {vendasFiltradas.map(venda => (
          <View key={venda.id} style={styles.vendaItem}>
            <View style={styles.vendaLinhaSuperior}>
              <View style={{ flex: 1 }}>
                {venda.cliente ? (
                  <Text style={styles.vendaCliente}>{venda.cliente}</Text>
                ) : (
                  <Text style={styles.vendaCliente}>Cliente não informado</Text>
                )}

                <Text style={styles.vendaDescricao}>{venda.descricao}</Text>
              </View>
              {renderStatusBadge(venda.status)}
            </View>

            <Text style={styles.vendaDataValor}>
              {venda.data} • Valor: R$ {venda.valor.toFixed(2)} • Lucro:{' '}
              R$ {venda.lucro.toFixed(2)}
            </Text>

            {venda.status !== 'entregue' && (
              <View style={styles.statusActionsRow}>
                {venda.status === 'feita' && (
                  <TouchableOpacity
                    style={styles.statusActionButton}
                    onPress={() => handleAlterarStatus(venda, 'pronta')}
                  >
                    <Text style={styles.statusActionButtonText}>
                      Marcar como pronta
                    </Text>
                  </TouchableOpacity>
                )}

                {venda.status === 'pronta' && (
                  <TouchableOpacity
                    style={styles.statusActionButton}
                    onPress={() => handleAlterarStatus(venda, 'paga')}
                  >
                    <Text style={styles.statusActionButtonText}>
                      Marcar como paga
                    </Text>
                  </TouchableOpacity>
                )}

                {venda.status === 'paga' && (
                  <TouchableOpacity
                    style={styles.statusActionButton}
                    onPress={() => handleAlterarStatus(venda, 'entregue')}
                  >
                    <Text style={styles.statusActionButtonText}>
                      Marcar como entregue
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {venda.status === 'entregue' && (
              <Text style={styles.vendaStatusFinalTexto}>
                Esta venda já foi concluída e não pode mais ser alterada.
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default StatusVendasScreen;
