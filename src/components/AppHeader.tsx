// src/components/AppHeader.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { styles } from '../styles';

type LojaRow = {
  logoUri?: string | null;
};

type AppHeaderProps = {
  titulo: string;
};

const AppHeader: React.FC<AppHeaderProps> = ({ titulo }) => {
  const db = useSQLiteContext();
  const [logoUri, setLogoUri] = useState<string | null>(null);

  useEffect(() => {
    const carregarLogo = async () => {
      try {
        const rows = await db.getAllAsync<LojaRow>(
          'SELECT logoUri FROM loja_config LIMIT 1;'
        );
        if (rows.length > 0 && rows[0].logoUri) {
          setLogoUri(rows[0].logoUri as string);
        }
      } catch (error) {
        console.log('Erro ao carregar logo no header:', error);
      }
    };

    carregarLogo();
  }, [db]);

  return (
    <View style={styles.headerTop}>
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={styles.headerLogoLarge} />
      ) : (
        <View style={styles.headerLogoPlaceholder}>
          <Text style={styles.headerLogoPlaceholderText}>RN²</Text>
        </View>
      )}

      <Text style={styles.headerScreenTitle}>{titulo}</Text>
    </View>
  );
};

export default AppHeader;
