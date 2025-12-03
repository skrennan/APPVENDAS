// src/components/FadeInView.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

const FadeInView: React.FC<ViewProps> = ({ style, children, ...rest }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }] }]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;
