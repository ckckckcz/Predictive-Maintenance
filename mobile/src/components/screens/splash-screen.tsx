import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { ScreenProps } from './types';
import { styles } from './splash-screen.styles';

export function SplashScreen({ onNavigate }: ScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onNavigate('onboarding1');
    }, 2800);
    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <View style={[styles.splashContainer, { backgroundColor: '#ffffff' }]}>
      <View style={styles.splashContent}>
        <Animated.Image
          source={require('@/assets/images/greenfields.png')}
          style={[styles.splashLogo, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}


