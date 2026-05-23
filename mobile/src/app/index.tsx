import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing } from '@/constants/theme';
import {
  SplashScreen,
  OnboardingScreen,
  LoginScreen,
  DashboardScreen,
  MachineDetailScreen,
  IncidentReportScreen,
  NotificationScreen,
  ProfileScreen,
} from '@/components/screens';
import {
  HomeIcon,
  IncidentIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  CheckIcon,
} from '@/components/ui/icons';
import { Home, ShieldAlert, Bell, User } from 'lucide-react-native';

export default function App() {
  // Theme state
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );

  // Screen navigation state
  // Possible screens: 'splash', 'onboarding1', 'onboarding2', 'onboarding3', 'login', 'dashboard', 'machineDetail', 'incidentReport', 'notifications', 'profile'
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [screenParams, setScreenParams] = useState<any>(null);

  // Persistent Demo states (e.g., adding dynamic incident reports)
  const [demoIncidents, setDemoIncidents] = useState<any[]>([]);

  // Showcase panel state
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  // Theme configuration overrides based on themeMode state
  const theme = Colors[themeMode];

  const handleNavigate = (screenName: string, params?: any) => {
    setCurrentScreen(screenName);
    if (params) {
      setScreenParams(params);
    }
  };

  const addDemoIncident = (incident: any) => {
    setDemoIncidents([incident, ...demoIncidents]);
  };

  // Render the current screen view
  const renderScreenContent = () => {
    const props = {
      themeMode,
      setThemeMode,
      onNavigate: handleNavigate,
      demoIncidents,
      addDemoIncident,
    };

    switch (currentScreen) {
      case 'splash':
        return <SplashScreen {...props} />;
      case 'onboarding1':
        return <OnboardingScreen step={1} {...props} />;
      case 'onboarding2':
        return <OnboardingScreen step={2} {...props} />;
      case 'onboarding3':
        return <OnboardingScreen step={3} {...props} />;
      case 'login':
        return <LoginScreen {...props} />;
      case 'dashboard':
        return <DashboardScreen {...props} />;
      case 'machineDetail':
        return <MachineDetailScreen {...props} params={screenParams} />;
      case 'incidentReport':
        return <IncidentReportScreen {...props} />;
      case 'notifications':
        return <NotificationScreen {...props} />;
      case 'profile':
        return <ProfileScreen {...props} />;
      default:
        return <DashboardScreen {...props} />;
    }
  };

  // Determine if we should show the bottom navigation tabs
  const showBottomTabs = [
    'dashboard',
    'machineDetail',
    'incidentReport',
    'notifications',
    'profile',
  ].includes(currentScreen);

  // Helper to check if a tab is active
  const isTabActive = (tabName: string) => {
    if (tabName === 'dashboard' && currentScreen === 'machineDetail') return true;
    return currentScreen === tabName;
  };

  // The 10 screens metadata for the Showcase switcher
  const showcaseScreens = [
    { id: 'splash', label: '1. Splash Screen' },
    { id: 'onboarding1', label: '2. Onboarding 1' },
    { id: 'onboarding2', label: '3. Onboarding 2' },
    { id: 'onboarding3', label: '4. Onboarding 3' },
    { id: 'login', label: '5. Login Screen' },
    { id: 'dashboard', label: '6. Dashboard Screen' },
    { id: 'machineDetail', label: '7. Machine Detail' },
    { id: 'incidentReport', label: '8. Lapor Insiden' },
    { id: 'notifications', label: '9. Notifikasi & Alarm' },
    { id: 'profile', label: '10. Profil & Settings' },
  ];

  // Mobile layout container inside web browser
  const AppContent = (
    <View style={[styles.phoneShell, { backgroundColor: theme.background }]}>
      {/* Simulated Device Status Bar */}
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.statusBarSimulator, { backgroundColor: theme.background }]}>
        <Text style={[styles.statusBarTime, { color: theme.text }]}>09:41</Text>
        <View style={styles.statusBarIcons}>
          <Text style={[styles.statusBarIconText, { color: theme.text }]}>📶</Text>
          <Text style={[styles.statusBarIconText, { color: theme.text }]}>🔋</Text>
        </View>
      </View>

      {/* Screen Render Container */}
      <View style={styles.screenContainer}>{renderScreenContent()}</View>

      {/* Custom Bottom Tab Navigation Bar */}
      {showBottomTabs && (
        <View style={[styles.tabBar, { backgroundColor: '#ffffff', borderTopColor: '#f1f5f9' }]}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('dashboard')}
            activeOpacity={0.7}
          >
            <Home
              size={20}
              color={isTabActive('dashboard') ? '#15803d' : '#64748b'}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isTabActive('dashboard') ? '#15803d' : '#64748b' },
              ]}
            >
              Beranda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('incidentReport')}
            activeOpacity={0.7}
          >
            <ShieldAlert
              size={20}
              color={isTabActive('incidentReport') ? '#15803d' : '#64748b'}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isTabActive('incidentReport') ? '#15803d' : '#64748b' },
              ]}
            >
              Lapor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('notifications')}
            activeOpacity={0.7}
          >
            <View>
              <Bell
                size={20}
                color={isTabActive('notifications') ? '#15803d' : '#64748b'}
              />
              <View style={[styles.tabNotificationBadge, { backgroundColor: '#dc2626' }]} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isTabActive('notifications') ? '#15803d' : '#64748b' },
              ]}
            >
              Notifikasi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('profile')}
            activeOpacity={0.7}
          >
            <User
              size={20}
              color={isTabActive('profile') ? '#15803d' : '#64748b'}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isTabActive('profile') ? '#15803d' : '#64748b' },
              ]}
            >
              Profil
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // If in web mode, render inside a beautiful simulated device mockup frame
  if (Platform.OS === 'web') {
    return (
      <View style={webContainerStyle}>
        {/* Decorative Grid Background */}
        <View style={webGridBackgroundStyle} />

        {/* Left Side: Showcase Information Board */}
        <View style={styles.infoPanel}>
          <Text style={styles.infoBrand}>GREENFIELDS IoT</Text>
          <Text style={styles.infoTitle}>Predictive Maintenance Mobile</Text>
          <Text style={styles.infoDesc}>
            Sebuah rancangan UI/UX mobile yang bersih, modern, dan fungsional untuk operator lapangan, mekanik, dan tim pemeliharaan pabrik.
          </Text>

          <View style={styles.infoFeatureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Aksen warna hijau Green-700 (#15803d)</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Tipografi premium menggunakan font Geist</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>10 Screen siap uji melalui menu disamping</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Dukungan sinkronisasi status anomali IoT</Text>
            </View>
          </View>
        </View>

        {/* Center: Device Frame Simulator */}
        <View style={styles.deviceSimulatorFrame}>
          <View style={styles.deviceSpeaker} />
          <View style={styles.deviceCamera} />
          {AppContent}
          <View style={styles.deviceHomeIndicator} />
        </View>

        {/* Right Side / Floating: Showcase Switcher Panel */}
        <View style={[styles.showcaseSelectorCard, showcaseOpen ? styles.showcaseOpen : styles.showcaseClosed]}>
          <TouchableOpacity
            style={styles.showcaseToggleBtn}
            onPress={() => setShowcaseOpen(!showcaseOpen)}
          >
            <SettingsIcon size={18} color="#ffffff" />
            <Text style={styles.showcaseToggleText}>
              {showcaseOpen ? 'Sembunyikan Menu' : 'Pilih Screen (10 Screens)'}
            </Text>
            {showcaseOpen ? <Text style={{color: '#fff'}}>✕</Text> : <View style={styles.pulseDot} />}
          </TouchableOpacity>

          {showcaseOpen && (
            <View style={styles.showcaseList}>
              <Text style={styles.showcaseHeaderTitle}>PILIH PREVIEW SCREEN</Text>
              {showcaseScreens.map((sc) => (
                <TouchableOpacity
                  key={sc.id}
                  style={[
                    styles.showcaseItem,
                    currentScreen === sc.id && styles.showcaseItemActive,
                  ]}
                  onPress={() => {
                    handleNavigate(sc.id);
                  }}
                >
                  <Text
                    style={[
                      styles.showcaseItemText,
                      currentScreen === sc.id && styles.showcaseItemTextActive,
                    ]}
                  >
                    {sc.label}
                  </Text>
                  {currentScreen === sc.id && <CheckIcon size={12} color="#15803d" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Native full-screen fallback
  return <SafeAreaView style={styles.nativeContainer}>{AppContent}</SafeAreaView>;
}

const webContainerStyle = {
  flex: 1,
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  backgroundColor: '#070a13',
  width: '100vw',
  height: '100vh',
  paddingHorizontal: 40,
  gap: 60,
  overflow: 'hidden' as const,
} as any;

const webGridBackgroundStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.04,
  backgroundImage: `radial-gradient(#15803d 1px, transparent 1px)`,
  backgroundSize: '24px 24px',
  zIndex: -1,
} as any;

const styles = StyleSheet.create({
  // Native Base Layout
  nativeContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  phoneShell: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  statusBarSimulator: {
    height: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusBarTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBarIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBarIconText: {
    fontSize: 11,
  },
  screenContainer: {
    flex: 1,
  },

  // Custom Navigation Tab Bar
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoPanel: {
    width: 320,
    gap: 16,
    display: 'flex',
  },
  infoBrand: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  infoDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoFeatureList: {
    gap: 10,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803d',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  deviceSimulatorFrame: {
    width: 375,
    height: 800,
    borderRadius: 44,
    borderWidth: 12,
    borderColor: '#1e293b',
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  deviceSpeaker: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: [{ translateX: -30 }],
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    zIndex: 100,
  },
  deviceCamera: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: 36 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    zIndex: 100,
  },
  deviceHomeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#334155',
    zIndex: 100,
  },

  // SHOWCASE CONTROL PANEL
  showcaseSelectorCard: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: 'hidden',
    zIndex: 9999,
  },
  showcaseOpen: {
    width: 250,
  },
  showcaseClosed: {
    width: 200,
  },
  showcaseToggleBtn: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#15803d',
  },
  showcaseToggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  showcaseList: {
    padding: 8,
    maxHeight: 400,
  },
  showcaseHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.5,
  },
  showcaseItem: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  showcaseItemActive: {
    backgroundColor: '#1e293b',
  },
  showcaseItemText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  showcaseItemTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
});
