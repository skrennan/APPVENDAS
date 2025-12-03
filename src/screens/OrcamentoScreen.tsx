// src/screens/OrcamentoScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// usamos a versão legacy pra evitar problemas de deprecated
import * as FileSystem from 'expo-file-system/legacy';
import { useSQLiteContext } from 'expo-sqlite';

import { styles } from '../styles';
import  AppHeader  from '../components/AppHeader';
import FadeInView from '../components/FadeInView';
import { LojaConfig, formatDateToBR } from '../utils';

type ItemOrcamento = {
  id: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
};

const OrcamentoScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [clienteNome, setClienteNome] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [validadeDias, setValidadeDias] = useState('7');

  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoQtd, setNovoQtd] = useState('1');
  const [novoValor, setNovoValor] = useState('');

  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  const [empresaNome, setEmpresaNome] = useState('Minha Loja de Personalizados');
  const [empresaContato, setEmpresaContato] = useState(
    'WhatsApp: (99) 99999-9999'
  );
  const [empresaObs, setEmpresaObs] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<LojaConfig>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );
        if (row) {
          setEmpresaNome(row.nome);
          setEmpresaContato(row.contato);
          setEmpresaObs(row.observacoes);
          // logo cadastrada na tela de login
          // (pode ser null)
          // @ts-ignore
          if (row.logoUri) setLogoUri(row.logoUri as string);
        }
      } catch (error) {
        console.log('Erro ao carregar loja_config em Orçamentos', error);
      }
    })();
  }, [db]);

  function adicionarItem() {
    const qtd = parseFloat(novoQtd.replace(',', '.')) || 0;
    const valor = parseFloat(novoValor.replace(',', '.')) || 0;

    if (!novoDescricao || qtd <= 0 || valor <= 0) {
      Alert.alert(
        'Atenção',
        'Preencha descrição, quantidade e valor maior que zero.'
      );
      return;
    }

    const novoItem: ItemOrcamento = {
      id: Date.now(),
      descricao: novoDescricao,
      quantidade: qtd,
      valorUnitario: valor,
    };

    setItens((prev) => [...prev, novoItem]);
    setNovoDescricao('');
    setNovoQtd('1');
    setNovoValor('');
  }

  function removerItem(id: number) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  const total = itens.reduce(
    (acc, i) => acc + i.quantidade * i.valorUnitario,
    0
  );

  async function gerarOrcamentoPDF() {
    if (!clienteNome) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }

    if (itens.length === 0) {
      Alert.alert('Atenção', 'Adicione ao menos um item ao orçamento.');
      return;
    }

    const validadeNumero = parseInt(validadeDias, 10) || 7;
    const hoje = new Date();
    const validadeData = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate() + validadeNumero
    );

    const hojeISO = hoje.toISOString().slice(0, 10);
    const hojeBR = formatDateToBR(hojeISO);
    const validadeBR = formatDateToBR(
      validadeData.toISOString().slice(0, 10)
    );

    // 🔹 LÊ A LOGO EM BASE64, SE TIVER
    let logoBase64: string | null = null;
    try {
      if (logoUri) {
        const fs = FileSystem as any;
        logoBase64 = await fs.readAsStringAsync(logoUri, {
          encoding: fs.EncodingType.Base64,
        });
      }
    } catch (error) {
      console.log('Erro ao ler logo em base64 para PDF', error);
      logoBase64 = null;
    }

    const logoHtml = logoBase64
      ? `<img src="data:image/png;base64,${logoBase64}"
              style="width:80px;height:80px;border-radius:40px;margin-right:12px;" />`
      : '';

    const linhasHtml = itens
      .map(
        (i) => `
        <tr>
          <td>${i.descricao}</td>
          <td class="center">${i.quantidade}</td>
          <td class="right">${i.valorUnitario.toFixed(2)}</td>
          <td class="right">${(i.quantidade * i.valorUnitario).toFixed(
            2
          )}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0; font-size: 20px; }
            h2 { margin-top: 24px; margin-bottom: 8px; font-size: 16px; }
            p { margin: 4px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 11px; }
            th { background-color: #f0f0f0; }
            .right { text-align: right; }
            .center { text-align: center; }
            .totais { margin-top: 16px; font-size: 13px; }
            .header-linha { display: flex; align-items: center; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="header-linha">
            ${logoHtml}
            <div>
              <h1>${empresaNome}</h1>
              <p>${empresaContato}</p>
            </div>
          </div>

          <h2>Orçamento</h2>
          <p><strong>Cliente:</strong> ${clienteNome}</p>
          ${
            clienteContato
              ? `<p><strong>Contato:</strong> ${clienteContato}</p>`
              : ''
          }
          <p><strong>Data:</strong> ${hojeBR}</p>
          <p><strong>Validade deste orçamento:</strong> até ${validadeBR}</p>

          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Valor unit. (R$)</th>
                <th>Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${linhasHtml}
            </tbody>
          </table>

          <div class="totais">
            <p><strong>Valor total do orçamento:</strong> R$ ${total.toFixed(
              2
            )}</p>
          </div>

          ${
            empresaObs
              ? `<p style="margin-top: 16px;"><strong>Observações:</strong> ${empresaObs}</p>`
              : ''
          }
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const hojeFile = hojeISO.replace(/-/g, '');
      const nomeSan = clienteNome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      const fileName = `orcamento_${hojeFile}_${nomeSan}.pdf`;

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
          dialogTitle: 'Compartilhar orçamento',
        });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em:\n${newPath}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF do orçamento.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader titulo="Orçamentos" />

        {/* DADOS DO CLIENTE */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="account-box-outline"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Dados do cliente</Text>
          </View>

          <Text style={styles.label}>Nome do cliente</Text>
          <TextInput
            style={styles.input}
            value={clienteNome}
            onChangeText={setClienteNome}
            placeholder="Ex: João da Silva"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Contato (opcional)</Text>
          <TextInput
            style={styles.input}
            value={clienteContato}
            onChangeText={setClienteContato}
            placeholder="Ex: (99) 98429-0321"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Validade do orçamento (dias)</Text>
          <TextInput
            style={styles.input}
            value={validadeDias}
            onChangeText={setValidadeDias}
            keyboardType="numeric"
            placeholder="Ex: 7"
            placeholderTextColor="#777"
          />
        </View>

        {/* ITENS DO ORÇAMENTO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="playlist-plus"
              size={20}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Itens do orçamento</Text>
          </View>

          <Text style={styles.label}>Descrição do item</Text>
          <TextInput
            style={styles.input}
            value={novoDescricao}
            onChangeText={setNovoDescricao}
            placeholder="Ex: Totem MDF 15x20"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            value={novoQtd}
            onChangeText={setNovoQtd}
            keyboardType="numeric"
            placeholder="Ex: 2"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Valor unitário (R$)</Text>
          <TextInput
            style={styles.input}
            value={novoValor}
            onChangeText={setNovoValor}
            keyboardType="numeric"
            placeholder="Ex: 40"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.botaoSecundario} onPress={adicionarItem}>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={20}
              color="#4e9bff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoSecundarioTexto}>Adicionar item</Text>
          </TouchableOpacity>

          {itens.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>
                Itens adicionados
              </Text>

              {itens.map((item) => (
                <View key={item.id} style={styles.orcItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orcItemText}>{item.descricao}</Text>
                    <Text style={styles.orcItemSubText}>
                      Qtd: {item.quantidade} • Valor unit.: R${' '}
                      {item.valorUnitario.toFixed(2)} • Total: R${' '}
                      {(item.quantidade * item.valorUnitario).toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => removerItem(item.id)}>
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={20}
                      color="#ff6666"
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.label, { marginTop: 8 }]}>
                Total do orçamento: R$ {total.toFixed(2)}
              </Text>
            </>
          )}
        </View>

        {/* GERAR PDF */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.botao} onPress={gerarOrcamentoPDF}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Gerar PDF do orçamento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrcamentoScreen;
