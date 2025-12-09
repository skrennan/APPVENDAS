// src/components/AppHeader.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import  styles  from '../styles';

type LojaConfigRow = {
  [key: string]: any;
};

type AppHeaderProps = {
  /** Texto do título da tela: "Registrar Vendas", "Relatórios", etc. */
  titulo: string;
};

const AppHeader: React.FC<AppHeaderProps> = ({ titulo }) => {
  const db = useSQLiteContext();
  const [nomeLoja, setNomeLoja] = React.useState<string>('RNN Vendas');
  const [logoUri, setLogoUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const carregarLoja = async () => {
      try {
        // Pega a última configuração da loja
        const rows = await db.getAllAsync<LojaConfigRow>(
          'SELECT * FROM loja_config ORDER BY id DESC LIMIT 1;'
        );

        if (!isMounted) return;

        const row = rows[0];

        if (row) {
          const nome =
            (row.nome as string | undefined) ||
            (row.nome_loja as string | undefined) ||
            'RNN Vendas';

          // tenta vários nomes de coluna possíveis para a logo
          const possibleLogoUri =
            (row.logo_uri as string | undefined) ||
            (row.logoUri as string | undefined) ||
            (row.logo_url as string | undefined) ||
            (row.logo as string | undefined) ||
            null;

          console.log('AppHeader - loja_config carregada:', row);
          console.log('AppHeader - logoUri detectado:', possibleLogoUri);

          setNomeLoja(nome);
          setLogoUri(possibleLogoUri);
        } else {
          console.log('AppHeader - nenhuma linha em loja_config');
        }
      } catch (error) {
        console.log('Erro ao carregar loja_config no AppHeader:', error);
      }
    };

    carregarLoja();

    return () => {
      isMounted = false;
    };
  }, [db]);

  return (
    <View style={styles.headerTop}>
      {/* LOGO */}
      <View style={styles.headerLogoWrapper}>
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            style={styles.headerLogo}
          />
        ) : (
          <View style={styles.headerLogoPlaceholder}>
            <Text style={styles.headerLogoPlaceholderText}>
              {nomeLoja.substring(0, 3).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* TÍTULO DA TELA */}
      <Text style={styles.headerTitle}>{titulo}</Text>

      {/* Nome da loja (subtítulo) */}
      <Text style={styles.headerSubtitle}>{nomeLoja}</Text>
    </View>
  );
};

export default AppHeader;
