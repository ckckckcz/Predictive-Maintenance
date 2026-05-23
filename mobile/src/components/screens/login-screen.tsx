import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ScreenProps } from './types';
import { styles } from './login-screen.styles';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { useAuth } from '@/hooks/use-auth';

export function LoginScreen({ onNavigate }: ScreenProps) {
  const theme = Colors.light;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      onNavigate('dashboard');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <ScrollView contentContainerStyle={styles.loginScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.loginBrandContainer}>
          <Image
            source={require('@/assets/images/greenfields.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Please enter your email and password to access Greenfields Dashboard
          </Text>
        </View>

        <View style={styles.inputsContainer}>
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
                editable={!isLoading}
              />
            </View>
          </View>

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
                editable={!isLoading}
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

        {error && (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        <View style={styles.forgotPasswordRow}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.loginSubmitBtnText}>Login</Text>
          )}
        </TouchableOpacity>

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
