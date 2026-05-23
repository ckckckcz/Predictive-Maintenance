import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ScreenProps } from './types';
import { styles } from './login-screen.styles';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';

export function LoginScreen({ onNavigate }: ScreenProps) {
  const theme = Colors.light;
  const [email, setEmail] = useState('operator@greenfields.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    onNavigate('dashboard');
  };

  return (
    <View style={styles.loginContainer}>
      <ScrollView contentContainerStyle={styles.loginScrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header: horizontal row */}
        <View style={styles.loginBrandContainer}>
          <Image
            source={require('@/assets/images/greenfields.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Please enter your email and password to access Greenfields Dashboard
          </Text>
        </View>

        {/* Inputs Section */}
        <View style={styles.inputsContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="eg. operator@greenfields.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Password <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOffIcon size={20} color={theme.textSecondary} />
                ) : (
                  <EyeIcon size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Forgot Password */}
        <View style={styles.forgotPasswordRow}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Log In Button */}
        <TouchableOpacity
          style={styles.loginSubmitBtn}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginSubmitBtnText}>Login</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.loginFooter}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.loginFooterText}>
              Butuh bantuan akses? <Text style={{ color: theme.primary, fontWeight: '700', textDecorationLine: 'underline' }}>Hubungi IT Support</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
