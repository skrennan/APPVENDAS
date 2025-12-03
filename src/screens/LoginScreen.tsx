// src/screens/LoginScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';

// VERSÃO LEGACY DO FILE SYSTEM
import * as FileSystem from 'expo-file-system/legacy';

import { styles } from '../styles';
import { LojaConfig } from '../utils';

const LoginScreen: React.FC = () => {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();

  const [nomeLoja, setNomeLoja] = useState('');
  const [contatoLoja, setContatoLoja] = useState('');
  const [observacoesLoja, setObservacoesLoja] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<LojaConfig & { id: number }>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );
        if (row) {
          setConfigId(row.id);
          setNomeLoja(row.nome);
          setContatoLoja(row.contato);
          setObservacoesLoja(row.observacoes);
          if (row.logoUri) setLogoUri(row.logoUri);
        }
      } catch (error) {
        console.log('Erro ao carregar loja_config no Login', error);
      } finally {
        setCarregando(false);
      }
    })();
  }, [db]);

  async function selecionarLogo() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Você precisa permitir acesso às fotos para escolher a logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // VOLTAMOS PRO MediaTypeOptions.Images PRA NÃO QUEBRAR O TS
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const fs = FileSystem as any;
      const baseDir = (fs.documentDirectory ??
        fs.cacheDirectory ??
        '') as string;

      if (!baseDir) {
        setLogoUri(asset.uri);
        return;
      }

      const logoPath = baseDir + 'logo_loja.png';

      await fs.copyAsync({
        from: asset.uri,
        to: logoPath,
      });

      setLogoUri(logoPath);
      Alert.alert('Logo selecionada', 'A logo foi atualizada com sucesso.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível selecionar a logo.');
    }
  }

  async function salvarConfig() {
    if (!nomeLoja || !contatoLoja) {
      Alert.alert(
        'Atenção',
        'Preencha pelo menos o nome da loja e o contato.'
      );
      return;
    }

    try {
      if (configId) {
        await db.runAsync(
          `
            UPDATE loja_config
            SET nome = ?, contato = ?, observacoes = ?, logoUri = ?
            WHERE id = ?;
          `,
          nomeLoja,
          contatoLoja,
          observacoesLoja,
          logoUri,
          configId
        );
      } else {
        const result = await db.runAsync(
          `
            INSERT INTO loja_config (nome, contato, observacoes, logoUri)
            VALUES (?, ?, ?, ?);
          `,
          nomeLoja,
          contatoLoja,
          observacoesLoja,
          logoUri
        );
        // @ts-ignore
        if (result?.lastInsertRowId) {
          // @ts-ignore
          setConfigId(result.lastInsertRowId as number);
        }
      }

      Alert.alert('Sucesso', 'Dados da loja salvos com sucesso!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar os dados da loja.');
    }
  }

  if (carregando) {
    return null;
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
        <View style={styles.card}>
          <View style={styles.cardHeaderLinha}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={22}
              color="#4e9bff"
            />
            <Text style={styles.cardTitulo}>Configuração da loja</Text>
          </View>

          {/* LOGO */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: 16,
              marginTop: 8,
            }}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: '#4e9bff',
                  marginBottom: 8,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: '#444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  backgroundColor: '#222',
                }}
              >
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={32}
                  color="#777"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={selecionarLogo}
            >
              <MaterialCommunityIcons
                name="image-edit-outline"
                size={20}
                color="#4e9bff"
                style={styles.botaoIcon}
              />
              <Text style={styles.botaoSecundarioTexto}>
                Escolher logo da loja
              </Text>
            </TouchableOpacity>
          </View>

          {/* CAMPOS DA LOJA */}
          <Text style={styles.label}>Nome da loja</Text>
          <TextInput
            style={styles.input}
            value={nomeLoja}
            onChangeText={setNomeLoja}
            placeholder="Ex: Personalizados da Naty"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Contato principal</Text>
          <TextInput
            style={styles.input}
            value={contatoLoja}
            onChangeText={setContatoLoja}
            placeholder="Ex: WhatsApp (99) 98429-0321"
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Observações / rodapé (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={observacoesLoja}
            onChangeText={setObservacoesLoja}
            multiline
            placeholder="Ex: Prazo padrão, políticas da loja, etc."
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.botao} onPress={salvarConfig}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color="#fff"
              style={styles.botaoIcon}
            />
            <Text style={styles.botaoTexto}>Salvar e entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
