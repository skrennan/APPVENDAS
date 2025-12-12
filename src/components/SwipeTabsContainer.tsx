// src/components/SwipeTabsContainer.tsx
import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

interface SwipeTabsContainerProps {
  children: React.ReactNode;
}

/**
 * Container que:
 *  - Arrasta a tela junto com o dedo (swipe horizontal)
 *  - Se arrastar o suficiente, troca de aba
 *  - Quando uma aba entra em foco, ela entra com slide suave
 */
const SwipeTabsContainer: React.FC<SwipeTabsContainerProps> = ({ children }) => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const translateX = useRef(new Animated.Value(0)).current;
  const lastIndexRef = useRef<number | null>(null);
  const screenWidth = useRef(Dimensions.get('window').width).current;

  const navState = navigation.getState();
  const routes = navState.routes;
  const currentIndex = routes.findIndex((r: any) => r.key === route.key);

  // animação de entrada quando a aba ganha foco
  useFocusEffect(
    React.useCallback(() => {
      const previousIndex = lastIndexRef.current;
      lastIndexRef.current = currentIndex;

      // primeira vez: entra sem slide
      if (previousIndex === null) {
        translateX.setValue(0);
        return;
      }

      let direction = 0;
      if (currentIndex > previousIndex) {
        // veio da aba da esquerda → entra vindo da direita (+)
        direction = 1;
      } else if (currentIndex < previousIndex) {
        // veio da aba da direita → entra vindo da esquerda (-)
        direction = -1;
      } else {
        // mesma aba, nada
        translateX.setValue(0);
        return;
      }

      // começa fora da tela e anima para 0
      translateX.setValue(direction * screenWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }, [currentIndex, screenWidth, translateX])
  );

  const navegarParaIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= routes.length) return;
    const nextRoute = routes[nextIndex];
    (navigation as any).jumpTo(nextRoute.name);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const { dx, dy } = gesture;
        // só responde a swipe mais horizontal que vertical
        return Math.abs(dx) > 15 && Math.abs(dy) < 15;
      },
      onPanResponderMove: (_evt, gesture) => {
        // move a tela junto com o dedo, limitado à largura da tela
        let newX = gesture.dx;
        const maxOffset = screenWidth;
        if (newX > maxOffset) newX = maxOffset;
        if (newX < -maxOffset) newX = -maxOffset;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const { dx } = gesture;
        const threshold = screenWidth * 0.25; // 25% da tela

        // swipe forte suficiente → troca de aba
        if (dx > threshold) {
          // para a direita → aba anterior
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            navegarParaIndex(currentIndex - 1);
          });
        } else if (dx < -threshold) {
          // para a esquerda → próxima aba
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            navegarParaIndex(currentIndex + 1);
          });
        } else {
          // não passou do limite → volta pro lugar
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX }],
      }}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

export default SwipeTabsContainer;
