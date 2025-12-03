// src/screens/VendasScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { styles } from '../styles';

type TipoItem = 'LASER' | '3D' | 'OUTRO';

type ItemVenda = {
  id: string;
  descricao: string;
  tipo: TipoItem;
  valor: string; // texto, depois converte para número
  custo: string;
};

const criarNovoItem = (): ItemVenda => ({
  id: String(Date.now() + Math.random()),
  descricao: '',
  tipo: 'LASER',
  valor: '',
  custo: '',
});

const VendasScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [cliente, setCliente] = useState('');
  const [data, setData] = useState<Date>(new Date());
  const [itens, setItens] = useState<ItemVenda[]>([criarNovoItem()]);
  const [salvando, setSalvando] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);

  // ------------------------------------------------------------
  // GARANTIR ESTRUTURA DO BANCO (coluna cliente + tabela venda_itens)
  // ------------------------------------------------------------
  const garantirEstruturaVendas = async () => {
    try {
      // coluna cliente na tabela vendas
      const colunas = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(vendas);'
      );

      const temCliente = colunas.some((c) => c.name === 'cliente');
      if (!temCliente) {
        try {
          await db.execAsync('ALTER TABLE vendas ADD COLUMN cliente TEXT;');
        } catch (err) {
          console.log('Coluna cliente já existe ou erro ao adicionar:', err);
        }
      }

      // tabela dos itens da venda
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS venda_itens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venda_id INTEGER NOT NULL,
          descricao TEXT NOT NULL,
          tipo TEXT NOT NULL,
          valor REAL NOT NULL,
          custo REAL NOT NULL,
          FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
        );
      `);
    } catch (error) {
      console.log('Erro ao garantir estrutura de vendas:', error);
    }
  };

  useEffect(() => {
    garantirEstruturaVendas();
  }, []);

  // ------------------------------------------------------------
  // FUNÇÕES AUXILIARES
  // ------------------------------------------------------------
  const atualizarItem = (
    id: string,
    campo: keyof ItemVenda,
    valor: string
  ) => {
    setItens((lista) =>
      lista.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  };

  const alterarTipoItem = (id: string, tipo: TipoItem) => {
    setItens((lista) =>
      lista.map((item) => (item.id === id ? { ...item, tipo } : item))
    );
  };

  const adicionarItem = () => {
    setItens((lista) => [...lista, criarNovoItem()]);
  };

  const removerItem = (id: string) => {
    setItens((lista) =>
      lista.length <= 1 ? lista : lista.filter((i) => i.id !== id)
    );
  };

  const formatarData = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const abrirDatePicker = () => {
    DateTimePickerAndroid.open({
      value: data,
      mode: 'date',
      onChange: (_event, selectedDate) => {
        if (selectedDate) setData(selectedDate);
      },
    });
  };

  const itensValidos = itens.filter(
    (i) =>
      i.descricao.trim().length > 0 ||
      i.valor.trim().length > 0 ||
      i.custo.trim().length > 0
  );

  const totalValor = itensValidos.reduce(
    (soma, item) => soma + (parseFloat(item.valor.replace(',', '.')) || 0),
    0
  );
  const totalCusto = itensValidos.reduce(
    (soma, item) => soma + (parseFloat(item.custo.replace(',', '.')) || 0),
    0
  );
  const totalLucro = totalValor - totalCusto;

  // ------------------------------------------------------------
  // SALVAR VENDA
  // ------------------------------------------------------------
  const tentarSalvarVenda = () => {
    if (itensValidos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um item à venda.');
      return;
    }
    setModalVisivel(true);
  };

  const fecharModal = () => setModalVisivel(false);

  const salvarVendaNoBanco = async () => {
    try {
      setSalvando(true);

      const descricaoResumo =
        itensValidos.length === 1
          ? itensValidos[0].descricao || `Venda de 1 item`
          : `${itensValidos.length} itens - ${
              itensValidos[0].descricao || ''
            }`;

      const tipoResumo: TipoItem =
        itensValidos.length === 1 ? itensValidos[0].tipo : 'OUTRO';

      const dataTexto = formatarData(data);

      // insere a venda principal
      const result: any = await db.runAsync(
        `INSERT INTO vendas (data, descricao, tipo, valor, custo, lucro, status, cliente)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          dataTexto,
          descricaoResumo,
          tipoResumo,
          totalValor,
          totalCusto,
          totalLucro,
          'feita',
          cliente.trim(),
        ]
      );

      const vendaId = result?.lastInsertRowId as number | undefined;
      if (!vendaId) {
        throw new Error('Não foi possível obter o ID da venda.');
      }

      // insere cada item individual
      for (const item of itensValidos) {
        const valor = parseFloat(item.valor.replace(',', '.')) || 0;
        const custo = parseFloat(item.custo.replace(',', '.')) || 0;

        await db.runAsync(
          `INSERT INTO venda_itens (venda_id, descricao, tipo, valor, custo)
           VALUES (?, ?, ?, ?, ?);`,
          [vendaId, item.descricao, item.tipo, valor, custo]
        );
      }

      setModalVisivel(false);

      Alert.alert('Sucesso', 'Venda salva com sucesso!');

      // limpa o formulário
      setCliente('');
      setData(new Date());
      setItens([criarNovoItem()]);
    } catch (error) {
      console.log('Erro ao salvar venda com itens:', error);
      Alert.alert('Erro', 'Não foi possível salvar a venda.');
    } finally {
      setSalvando(false);
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView>
          <AppHeader titulo="Registrar Vendas" />

          {/* CLIENTE + DATA */}
          <View style={styles.card}>
            <Text style={styles.label}>Cliente</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do cliente (opcional)"
              placeholderTextColor="#9ca3af"
              value={cliente}
              onChangeText={setCliente}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>
              Data da venda
            </Text>
            <TouchableOpacity
              style={styles.inputDate}
              onPress={abrirDatePicker}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={18}
                color="#e5e7eb"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.inputDateText}>{formatarData(data)}</Text>
            </TouchableOpacity>
          </View>

          {/* ITENS DA VENDA */}
          <View style={styles.card}>
            <View style={styles.cardHeaderLinha}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={20}
                color="#4e9bff"
              />
              <Text style={styles.cardTitulo}>Itens da venda</Text>
            </View>

            {itens.map((item, index) => (
              <View key={item.id} style={styles.itemVendaCard}>
                <View style={styles.itemVendaHeader}>
                  <Text style={styles.itemVendaTitulo}>
                    Item {index + 1}
                  </Text>

                  {itens.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removerItem(item.id)}
                      style={styles.itemVendaRemover}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color="#f97373"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Totem MDF 15x20"
                  placeholderTextColor="#9ca3af"
                  value={item.descricao}
                  onChangeText={(t) =>
                    atualizarItem(item.id, 'descricao', t)
                  }
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Tipo</Text>
                <View style={styles.tipoLinha}>
                  {(['LASER', '3D', 'OUTRO'] as TipoItem[]).map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      style={[
                        styles.tipoBotao,
                        item.tipo === tipo && styles.tipoBotaoAtivo,
                      ]}
                      onPress={() => alterarTipoItem(item.id, tipo)}
                    >
                      <Text
                        style={[
                          styles.tipoBotaoTexto,
                          item.tipo === tipo && styles.tipoBotaoTextoAtivo,
                        ]}
                      >
                        {tipo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Valor cobrado do cliente (R$)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 80"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.valor}
                  onChangeText={(t) =>
                    atualizarItem(item.id, 'valor', t)
                  }
                />

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Custo de produção (R$)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.custo}
                  onChangeText={(t) =>
                    atualizarItem(item.id, 'custo', t)
                  }
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={adicionarItem}
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={18}
                color="#e5e7eb"
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoSecundarioTexto}>
                Adicionar item
              </Text>
            </TouchableOpacity>
          </View>

          {/* RESUMO */}
          <View style={styles.card}>
            <Text style={styles.label}>Resumo da venda</Text>

            <Text style={styles.resumoLinha}>
              Total cobrado:{' '}
              <Text style={styles.resumoValor}>
                R$ {totalValor.toFixed(2).replace('.', ',')}
              </Text>
            </Text>
            <Text style={styles.resumoLinha}>
              Custo total:{' '}
              <Text style={styles.resumoValor}>
                R$ {totalCusto.toFixed(2).replace('.', ',')}
              </Text>
            </Text>
            <Text style={styles.resumoLinha}>
              Lucro estimado:{' '}
              <Text style={styles.resumoValor}>
                R$ {totalLucro.toFixed(2).replace('.', ',')}
              </Text>
            </Text>

            <TouchableOpacity
              style={[styles.botaoPrimario, { marginTop: 16 }]}
              onPress={tentarSalvarVenda}
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

      {/* MODAL CONFIRMAÇÃO */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar venda</Text>

            <Text style={styles.modalMessage}>
              Cliente:{' '}
              <Text style={styles.modalStatusHighlight}>
                {cliente.trim() || 'Não informado'}
              </Text>
            </Text>

            <Text style={styles.modalMessage}>
              Total cobrado:{' '}
              <Text style={styles.modalStatusHighlight}>
                R$ {totalValor.toFixed(2).replace('.', ',')}
              </Text>
            </Text>

            <Text style={styles.modalMessage}>
              Lucro estimado:{' '}
              <Text style={styles.modalStatusHighlight}>
                R$ {totalLucro.toFixed(2).replace('.', ',')}
              </Text>
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModal}
                disabled={salvando}
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
                onPress={salvarVendaNoBanco}
                disabled={salvando}
              >
                <Text style={styles.modalButtonText}>
                  {salvando ? 'Salvando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VendasScreen;
