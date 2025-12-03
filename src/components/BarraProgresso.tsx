// src/components/BarraProgresso.tsx
import React from 'react';
import { View } from 'react-native';
import { styles } from '../styles';
import type { BarraProgressoProps } from '../utils';

export const BarraProgresso: React.FC<BarraProgressoProps> = ({
  porcentagem,
}) => (
  <View style={styles.barraFundo}>
    <View style={[styles.barraPreenchida, { width: `${porcentagem}%` }]} />
  </View>
);
