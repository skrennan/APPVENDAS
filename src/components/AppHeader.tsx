// src/components/AppHeader.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import styles from '../styles';

type LojaConfig = {
  id: number;
  nome: string;
  contato?: string | null;
  observacoes?: string | null;
  logo_uri?: string | null; // mesma coluna usada no cadastro da loja
};

const AppHeader: React.FC = () => {
  const db = useSQLiteContext();
  const [loja, setLoja] = useState<LojaConfig | null>(null);

  useEffect(() => {
    const carregarLoja = async () => {
      try {
        const rows = await db.getAllAsync<LojaConfig>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );
        setLoja(rows[0] ?? null);
      } catch (error) {
        console.log('Erro ao carregar loja_config:', error);
      }
    };

    carregarLoja();
  }, [db]);

  const titulo = loja?.nome || 'RNN Vendas';
  const logoUri = loja?.logo_uri || null;

  const temLogo = !!logoUri;

  return (
    <View style={styles.headerTop}>
      <View style={styles.headerLogoWrapper}>
        {temLogo ? (
          <Image
            source={{ uri: logoUri as string }}
            // 👉 aqui usamos headerLogo, que EXISTE no styles.ts
            style={styles.headerLogo}
          />
        ) : (
          <View style={styles.headerLogoPlaceholder}>
            <Text style={styles.headerLogoPlaceholderText}>
              {titulo.substring(0, 3).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* 👉 e aqui usamos headerTitle, que também existe */}
      <Text style={styles.headerTitle}>{titulo}</Text>
    </View>
  );
};

export default AppHeader;
