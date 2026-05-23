import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ScreenProps } from './types';
import { styles } from './onboarding-screen.styles';

interface OnboardingProps extends ScreenProps {
  step: 1 | 2 | 3;
}

export function OnboardingScreen({ step, onNavigate }: OnboardingProps) {
  const getStepData = () => {
    switch (step) {
      case 1:
        return {
          title: "Semua mesin dalam genggaman",
          desc: "Monitoring kondisi operasional secara real-time melalui sistem terpusat.",
          nextScreen: "onboarding2",
          image: require('@/assets/images/boarding-1.png'),
        };
      case 2:
        return {
          title: "Kurangi risiko downtime.",
          desc: "Deteksi potensi masalah lebih awal sebelum berdampak pada produksi.",
          nextScreen: "onboarding3",
          image: require('@/assets/images/boarding-2.png'),
        };
      case 3:
        return {
          title: "Laporan lapangan lebih praktis",
          desc: "Catat insiden, kirim laporan, dan bantu proses maintenance langsung dari aplikasi mobile.",
          nextScreen: "login",
          image: require('@/assets/images/boarding-3.png'),
        };
    }
  };

  const data = getStepData();

  return (
    <View style={styles.onboardingContainer}>
      {/* Top Row: Skip button */}
      <View style={styles.onboardingHeader}>
        {step < 3 ? (
          <TouchableOpacity onPress={() => onNavigate('login')}>
            <Text style={styles.onboardingSkipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Visual Section */}
      <View style={styles.onboardingVisualContainer}>
        <Image
          source={data.image}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>

      {/* Content Section */}
      <View style={styles.onboardingContentContainer}>
        <Text style={styles.onboardingTitle}>{data.title}</Text>
        <Text style={styles.onboardingDesc}>{data.desc}</Text>
      </View>

      {/* Footer (Dots + Button) */}
      <View style={styles.onboardingFooter}>
        {/* Step Indicator Dots */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.indicatorDot, step === 1 ? styles.indicatorActive : null]} />
          <View style={[styles.indicatorDot, step === 2 ? styles.indicatorActive : null]} />
          <View style={[styles.indicatorDot, step === 3 ? styles.indicatorActive : null]} />
        </View>

        {/* Next / Finish Button */}
        <TouchableOpacity
          style={styles.onboardingBtn}
          onPress={() => onNavigate(data.nextScreen)}
        >
          <Text style={styles.onboardingBtnText}>
            {step === 3 ? "Mulai Sekarang" : "Lanjut"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

