// src/screens/RelatoriosScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import  styles  from '../styles';
import  AppHeader  from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import {
  formatDateToBR,
  LojaConfig,
  StatusVenda,
  statusLabels,
} from '../utils';

type VendaRow = {
  id: number;
  data: string;
  descricao: string;
  tipo: string;
  valor: number;
  custo: number;
  lucro: number;
  status?: StatusVenda | null;
};

type TotaisRow = {
  faturamento: number | null;
  custo: number | null;
  lucro: number | null;
};

type ComprasTotaisRow = {
  comprasTotal: number | null;
};

const RelatoriosScreen: React.FC = () => {
  const db = useSQLiteContext();

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const [dataInicioISO, setDataInicioISO] = useState(
    primeiroDia.toISOString().slice(0, 10)
  );
  const [dataFimISO, setDataFimISO] = useState(
    ultimoDia.toISOString().slice(0, 10)
  );

  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFimPicker, setShowFimPicker] = useState(false);

  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [faturamento, setFaturamento] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [lucroTotal, setLucroTotal] = useState(0);
  const [comprasTotal, setComprasTotal] = useState(0);

  const [empresaNome, setEmpresaNome] = useState('Minha Loja de Personalizados');
  const [empresaContato, setEmpresaContato] = useState(
    'WhatsApp: (99) 99999-9999'
  );

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<LojaConfig>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );
        if (row) {
          setEmpresaNome(row.nome);
          setEmpresaContato(row.contato);
        }
      } catch (error) {
        console.log('Erro ao carregar loja_config em Relatórios', error);
      }
    })();
  }, [db]);

  useEffect(() => {
    carregarRelatorio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChangeDataInicio(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowInicioPicker(false);
    if (date) {
      setDataInicioISO(date.toISOString().slice(0, 10));
    }
  }

  function onChangeDataFim(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowFimPicker(false);
    if (date) {
      setDataFimISO(date.toISOString().slice(0, 10));
    }
  }

  async function carregarRelatorio() {
    if (dataFimISO < dataInicioISO) {
      Alert.alert(
        'Atenção',
        'A data final não pode ser menor que a data inicial.'
      );
      return;
    }

    try {
      // totais das vendas
      const totais = await db.getFirstAsync<TotaisRow>(
        `
        SELECT 
          IFNULL(SUM(valor), 0) AS faturamento,
          IFNULL(SUM(custo), 0) AS custo,
          IFNULL(SUM(lucro), 0) AS lucro
        FROM vendas
        WHERE data BETWEEN ? AND ?;
      `,
        dataInicioISO,
        dataFimISO
      );

      setFaturamento(totais?.faturamento ?? 0);
      setCustoTotal(totais?.custo ?? 0);
      setLucroTotal(totais?.lucro ?? 0);

      // compras/despesas no período
      const comprasRow = await db.getFirstAsync<ComprasTotaisRow>(
        `
          SELECT IFNULL(SUM(valor), 0) AS comprasTotal
          FROM compras
          WHERE data BETWEEN ? AND ?;
        `,
        dataInicioISO,
        dataFimISO
      );

      setComprasTotal(comprasRow?.comprasTotal ?? 0);

      // lista de vendas
      const lista = await db.getAllAsync<VendaRow>(
        `
        SELECT id, data, descricao, tipo, valor, custo, lucro, status
        FROM vendas
        WHERE data BETWEEN ? AND ?
        ORDER BY data ASC, id ASC;
      `,
        dataInicioISO,
        dataFimISO
      );

      setVendas(Array.isArray(lista) ? lista.filter(Boolean) : []);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o relatório.');
    }
  }

  async function gerarRelatorioPDF() {
    if (!Array.isArray(vendas) || vendas.length === 0) {
      Alert.alert(
        'Atenção',
        'Não há vendas no período selecionado para gerar o PDF.'
      );
      return;
    }

    const inicioBR = formatDateToBR(dataInicioISO);
    const fimBR = formatDateToBR(dataFimISO);
    const lucroReal = lucroTotal - comprasTotal;

    const linhasHtml = vendas
      .filter(Boolean)
      .map((v) => {
        const statusTexto =
          (v.status && statusLabels[v.status]) || '—';
        return `
          <tr>
            <td>${formatDateToBR(v.data)}</td>
            <td>${v.descricao}</td>
            <td>${v.tipo}</td>
            <td>${statusTexto}</td>
            <td class="right">${v.valor.toFixed(2)}</td>
            <td class="right">${v.custo.toFixed(2)}</td>
            <td class="right">${v.lucro.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 24px; margin-bottom: 8px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 11px; }
            th { background-color: #f0f0f0; }
            .right { text-align: right; }
            .totais { margin-top: 16px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>${empresaNome}</h1>
          <p>${empresaContato}</p>
          <h2>Relatório de vendas</h2>
          <p><strong>Período:</strong> ${inicioBR} até ${fimBR}</p>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Valor (R$)</th>
                <th>Custo (R$)</th>
                <th>Lucro (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${linhasHtml}
            </tbody>
          </table>

          <div class="totais">
            <p><strong>Faturamento total:</strong> R$ ${faturamento.toFixed(
              2
            )}</p>
            <p><strong>Custo total das vendas:</strong> R$ ${custoTotal.toFixed(
              2
            )}</p>
            <p><strong>Lucro bruto das vendas:</strong> R$ ${lucroTotal.toFixed(
              2
            )}</p>
            <p><strong>Compras / despesas no período:</strong> R$ ${comprasTotal.toFixed(
              2
            )}</p>
            <p><strong>Lucro real do período (após compras):</strong> R$ ${lucroReal.toFixed(
              2
            )}</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const inicioFile = dataInicioISO.replace(/-/g, '');
      const fimFile = dataFimISO.replace(/-/g, '');
      const fileName = `relatorio_${inicioFile}_${fimFile}.pdf`;

      const fs = FileSystem as any;
      const documentsDir = (fs.documentDirectory ?? fs.cacheDirectory ?? '') as string;
      const newPath = documentsDir + fileName;

      await fs.moveAsync({
        from: uri,
        to: newPath,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar relatório de vendas',
        });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em:\n${newPath}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF do relatório.');
    }
  }

  const lucroReal = lucroTotal - comprasTotal;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader titulo="Relatórios de Vendas" />

        {/* PERÍODO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="calendar-range"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Período</Text>
          </View>

          <Text style={styles.label}>Data inicial</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowInicioPicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-start"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataInicioISO)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Data final</Text>
          <TouchableOpacity
            style={[styles.input, styles.inputDate]}
            onPress={() => setShowFimPicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-end"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputDateText}>
              {formatDateToBR(dataFimISO)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={carregarRelatorio}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color="#4e9bff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoSecundarioTexto}>
              Atualizar relatório
            </Text>
          </TouchableOpacity>
        </View>

        {/* RESUMO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Resumo do período</Text>
          </View>

          <Text style={styles.label}>
            Faturamento: R$ {faturamento.toFixed(2)}
          </Text>
          <Text style={styles.label}>
            Custo total das vendas: R$ {custoTotal.toFixed(2)}
          </Text>
          <Text style={styles.label}>
            Lucro bruto das vendas: R$ {lucroTotal.toFixed(2)}
          </Text>
          <Text style={styles.label}>
            Compras / despesas: R$ {comprasTotal.toFixed(2)}
          </Text>
          <Text style={[styles.label, { fontWeight: 'bold', marginTop: 4 }]}>
            Lucro real do período: R$ {lucroReal.toFixed(2)}
          </Text>

          <TouchableOpacity style={styles.botao} onPress={gerarRelatorioPDF}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Gerar PDF do período</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE VENDAS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Vendas no período</Text>
          </View>

          {(!Array.isArray(vendas) || vendas.length === 0) && (
            <Text style={styles.label}>
              Nenhuma venda encontrada nesse período.
            </Text>
          )}

          {Array.isArray(vendas) &&
            vendas.filter(Boolean).map((v) => (
              <View key={v.id} style={styles.orcItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orcItemText}>{v.descricao}</Text>
                  <Text style={styles.orcItemSubText}>
                    {formatDateToBR(v.data)} • {v.tipo} • Status:{' '}
                    {v.status ? statusLabels[v.status] : '—'} • Valor: R${' '}
                    {v.valor.toFixed(2)} • Lucro: R$ {v.lucro.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      {showInicioPicker && (
        <DateTimePicker
          value={new Date(dataInicioISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDataInicio}
        />
      )}

      {showFimPicker && (
        <DateTimePicker
          value={new Date(dataFimISO)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDataFim}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default RelatoriosScreen;
