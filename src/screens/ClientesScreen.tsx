// src/screens/ClientesScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import  styles  from '../styles';

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
};

const ClientesScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await db.getAllAsync<Cliente>(
        'SELECT * FROM clientes ORDER BY nome;'
      );
      setClientes(rows);
    } catch (error) {
      console.log('Erro ao carregar clientes', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  // 👉 dispara toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        if (!ativo) return;
        await carregarClientes();
      })();

      // cleanup: se sair da tela antes de terminar, evita setState
      return () => {
        ativo = false;
      };
    }, [carregarClientes])
  );

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.clienteRow}>
      <View>
        <Text style={styles.clienteNome}>{item.nome}</Text>
        {item.telefone ? (
          <Text style={styles.clienteTelefone}>{item.telefone}</Text>
        ) : null}
        {item.observacoes ? (
          <Text style={styles.cardSubtitle}>{item.observacoes}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.scroll}>
        <Text style={styles.sectionTitle}>Clientes</Text>

        {loading ? (
          <ActivityIndicator color="#3b82f6" />
        ) : (
          <FlatList
            data={clientes}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhum cliente cadastrado ainda.
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
};

export default ClientesScreen;
