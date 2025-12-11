// src/components/AppHeader.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles';

type AppHeaderProps = {
  titulo: string;
  logoUri?: string | null;
};

const AppHeader: React.FC<AppHeaderProps> = ({ titulo, logoUri }) => {
  return (
    <View style={styles.headerTop}>
      <View style={styles.headerLogoWrapper}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.headerLogo} />
        ) : (
          <View style={styles.headerLogoPlaceholder}>
            <Text style={styles.headerLogoPlaceholderText}>RN²</Text>
          </View>
        )}
      </View>

      <Text style={styles.headerTitle}>{titulo}</Text>
    </View>
  );
};

export default AppHeader;
