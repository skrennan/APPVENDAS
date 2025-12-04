// src/screens/RelatoriosScreen.tsx
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type VendaRow = {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  custo: number;
  lucro: number;
  tipo: string;
  status: string;
  cliente?: string | null;
};

type ClienteRow = {
  id: number;
  nome: string;
  telefone?: string | null;
};

const parseDateBRToDate = (dateStr: string): Date | null => {
  // Espera "DD/MM/AAAA"
  const [dia, mes, ano] = dateStr.split('/');
  const d = Number(dia);
  const m = Number(mes) - 1;
  const y = Number(ano);
  if (!d || !y || m < 0) return null;
  return new Date(y, m, d);
};

const formatDateBR = (d: Date): string => {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

const RelatoriosScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1); // primeiro dia do mês
  });
  const [dataFim, setDataFim] = useState<Date>(new Date());

  const [mostraPickerInicio, setMostraPickerInicio] = useState(false);
  const [mostraPickerFim, setMostraPickerFim] = useState(false);

  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [totalReceita, setTotalReceita] = useState(0);
  const [totalCusto, setTotalCusto] = useState(0);
  const [totalLucro, setTotalLucro] = useState(0);

  // Cliente filtrado
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteRow | null>(null);
  const [clientesModalVisivel, setClientesModalVisivel] = useState(false);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');

  // -----------------------------
  // Carregar clientes para filtro
  // -----------------------------
  const carregarClientes = async (filtro: string = '') => {
    try {
      const like = `%${filtro.trim()}%`;
      const lista = await db.getAllAsync<ClienteRow>(
        `
          SELECT id, nome, telefone
          FROM clientes
          WHERE nome LIKE ?
          ORDER BY nome ASC;
        `,
        [like]
      );
      setClientes(Array.isArray(lista) ? lista.filter(Boolean) : []);
    } catch (error) {
      console.log('Erro ao carregar clientes para relatório:', error);
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

  const selecionarCliente = (c: ClienteRow | null) => {
    setClienteSelecionado(c);
    setClientesModalVisivel(false);
  };

  // -----------------------------
  // Carregar vendas / resumo
  // -----------------------------
  const carregarRelatorio = async () => {
    try {
      // Busca todas vendas cadastradas
      const lista = await db.getAllAsync<VendaRow>(
        `
          SELECT id, data, descricao, valor, custo, lucro, tipo, status, cliente
          FROM vendas
          ORDER BY id DESC;
        `
      );

      const inicio = new Date(
        dataInicio.getFullYear(),
        dataInicio.getMonth(),
        dataInicio.getDate(),
        0,
        0,
        0,
        0
      ).getTime();
      const fim = new Date(
        dataFim.getFullYear(),
        dataFim.getMonth(),
        dataFim.getDate(),
        23,
        59,
        59,
        999
      ).getTime();

      const filtradas = (lista || []).filter((v) => {
        if (!v?.data) return false;
        const d = parseDateBRToDate(v.data);
        if (!d) return false;
        const time = d.getTime();
        if (time < inicio || time > fim) return false;

        // filtro por cliente (se definido)
        if (clienteSelecionado?.nome) {
          return (v.cliente || '').trim() === clienteSelecionado.nome.trim();
        }

        return true;
      });

      setVendas(filtradas);

      let receita = 0;
      let custo = 0;
      let lucro = 0;

      filtradas.forEach((v) => {
        receita += Number(v.valor) || 0;
        custo += Number(v.custo) || 0;
        lucro += Number(v.lucro) || 0;
      });

      setTotalReceita(receita);
      setTotalCusto(custo);
      setTotalLucro(lucro);
    } catch (error) {
      console.log('Erro ao carregar relatórios:', error);
    }
  };

  useEffect(() => {
    carregarRelatorio();
  }, [dataInicio, dataFim, clienteSelecionado]);

  const onChangeInicio = (_: any, selected?: Date) => {
    setMostraPickerInicio(false);
    if (selected) setDataInicio(selected);
  };

  const onChangeFim = (_: any, selected?: Date) => {
    setMostraPickerFim(false);
    if (selected) setDataFim(selected);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <FadeInView>
        <AppHeader titulo="Relatórios" />

        {/* CARD FILTROS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Filtros</Text>

          <Text style={styles.label}>Período</Text>
          <View style={styles.filtrosLinha}>
            <TouchableOpacity
              style={[styles.inputDate, { flex: 1 }]}
              onPress={() => setMostraPickerInicio(true)}
            >
              <MaterialCommunityIcons
                name="calendar-start"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.inputDateText}>
                Início: {formatDateBR(dataInicio)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputDate, { flex: 1 }]}
              onPress={() => setMostraPickerFim(true)}
            >
              <MaterialCommunityIcons
                name="calendar-end"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.inputDateText}>
                Fim: {formatDateBR(dataFim)}
              </Text>
            </TouchableOpacity>
          </View>

          {mostraPickerInicio && (
            <DateTimePicker
              value={dataInicio}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeInicio}
            />
          )}

          {mostraPickerFim && (
            <DateTimePicker
              value={dataFim}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeFim}
            />
          )}

          {/* Filtro de Cliente */}
          <Text style={[styles.label, { marginTop: 12 }]}>Cliente</Text>
          <View style={styles.filtrosLinha}>
            <TouchableOpacity
              style={[styles.inputDate, { flex: 1 }]}
              onPress={abrirModalClientes}
            >
              <MaterialCommunityIcons
                name="account-search"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.inputDateText}>
                {clienteSelecionado ? clienteSelecionado.nome : 'Todos'}
              </Text>
            </TouchableOpacity>

            {clienteSelecionado && (
              <TouchableOpacity
                style={[styles.botaoSecundario, { flexShrink: 0 }]}
                onPress={() => selecionarCliente(null)}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={18}
                  color="#e5e7eb"
                  style={styles.botaoIcon}
                />
                <Text style={styles.botaoSecundarioTexto}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Botão manual pra recarregar, caso queira forçar */}
          <TouchableOpacity
            style={[styles.botaoSecundario, { marginTop: 12 }]}
            onPress={carregarRelatorio}
          >
            <MaterialCommunityIcons
              name="reload"
              size={18}
              color="#e5e7eb"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoSecundarioTexto}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {/* CARD RESUMO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumo do período</Text>

          <Text style={styles.vendaDataValor}>
            Total de vendas:{' '}
            <Text style={styles.valorDestaque}>{vendas.length}</Text>
          </Text>
          <Text style={styles.vendaDataValor}>
            Receita:{' '}
            <Text style={styles.valorDestaque}>
              R$ {totalReceita.toFixed(2).replace('.', ',')}
            </Text>
          </Text>
          <Text style={styles.vendaDataValor}>
            Custo:{' '}
            <Text style={styles.valorDestaque}>
              R$ {totalCusto.toFixed(2).replace('.', ',')}
            </Text>
          </Text>
          <Text style={styles.vendaDataValor}>
            Lucro:{' '}
            <Text style={styles.valorDestaque}>
              R$ {totalLucro.toFixed(2).replace('.', ',')}
            </Text>
          </Text>
        </View>

        {/* LISTA DE VENDAS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vendas no período</Text>

          {vendas.length === 0 ? (
            <Text style={styles.listaVaziaTexto}>
              Nenhuma venda encontrada com esses filtros.
            </Text>
          ) : (
            vendas.map((venda) => (
              <View key={venda.id} style={styles.vendaLinha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendaDescricao}>{venda.descricao}</Text>
                  <Text style={styles.vendaDataValor}>
                    Data: {venda.data} • Tipo: {venda.tipo} • Status:{' '}
                    {venda.status}
                  </Text>
                  {venda.cliente ? (
                    <Text style={styles.vendaDataValor}>
                      Cliente: {venda.cliente}
                    </Text>
                  ) : null}
                  <Text style={styles.vendaDataValor}>
                    Valor: R${' '}
                    {Number(venda.valor).toFixed(2).replace('.', ',')} • Custo:
                    R${' '}
                    {Number(venda.custo).toFixed(2).replace('.', ',')} • Lucro:
                    R${' '}
                    {Number(venda.lucro).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </FadeInView>

      {/* MODAL DE CLIENTES PARA FILTRO */}
      <Modal
        visible={clientesModalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModalClientes}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por cliente</Text>

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
              {/* opção "Todos" */}
              <TouchableOpacity
                style={styles.clienteRow}
                onPress={() => selecionarCliente(null)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.clienteNome}>Todos os clientes</Text>
                  <Text style={styles.clienteTelefone}>
                    Não aplicar filtro por cliente
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#9ca3af"
                />
              </TouchableOpacity>

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
    </ScrollView>
  );
};

export default RelatoriosScreen;
