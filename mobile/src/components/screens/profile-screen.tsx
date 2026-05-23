import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  MoonIcon,
  SunIcon,
  BellIcon,
  SettingsIcon,
  LogOutIcon,
} from '@/components/ui/icons';
import { ScreenProps } from './types';
import { styles } from './profile-screen.styles';

export function ProfileScreen({ themeMode, setThemeMode, onNavigate }: ScreenProps) {
  const theme = useTheme();
  const [notifyMails, setNotifyMails] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.profileScrollContainer}>
      <Text style={[styles.reportScreenHeader, { color: theme.text }]}>Profil & Pengaturan</Text>
      
      {/* Profile Card Info */}
      <View style={[styles.profileCard, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
        <View style={styles.profileAvatarRow}>
          <View style={[styles.avatarBox, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>PW</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={[styles.profileNameText, { color: theme.text }]}>Prasetyo Wibowo</Text>
            <Text style={[styles.profileEmailText, { color: theme.textSecondary }]}>prasetyo.w@greenfields.com</Text>
            
            <View style={styles.badgeRow}>
              <Text style={[styles.profileBadge, { backgroundColor: theme.primaryLight, color: theme.primary }]}>
                Field Operator
              </Text>
              <Text style={[styles.profileBadge, { backgroundColor: theme.backgroundElement, color: theme.textSecondary }]}>
                Shift Pagi
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Preferences */}
      <Text style={[styles.profileSectionTitle, { color: theme.text }]}>Preferensi Aplikasi</Text>
      
      <View style={[styles.settingsGroupCard, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
        {/* Toggle Dark Mode */}
        <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingsLabelCol}>
            <View style={styles.settingsIconLabelRow}>
              {themeMode === 'dark' ? <MoonIcon size={18} color={theme.text} /> : <SunIcon size={18} color={theme.text} />}
              <Text style={[styles.settingsTitleText, { color: theme.text }]}>Mode Gelap (Dark Mode)</Text>
            </View>
            <Text style={[styles.settingsDescText, { color: theme.textSecondary }]}>Aktifkan tema gelap untuk kenyamanan mata di area pabrik redup</Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(val) => setThemeMode && setThemeMode(val ? 'dark' : 'light')}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Toggle Push Alerts */}
        <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingsLabelCol}>
            <View style={styles.settingsIconLabelRow}>
              <BellIcon size={18} color={theme.text} />
              <Text style={[styles.settingsTitleText, { color: theme.text }]}>Alarm & Notifikasi Push</Text>
            </View>
            <Text style={[styles.settingsDescText, { color: theme.textSecondary }]}>Terima anomali getaran/suhu secara instan</Text>
          </View>
          <Switch
            value={notifyPush}
            onValueChange={setNotifyPush}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Toggle Email Alerts */}
        <View style={styles.settingsRow}>
          <View style={styles.settingsLabelCol}>
            <View style={styles.settingsIconLabelRow}>
              <SettingsIcon size={18} color={theme.text} />
              <Text style={[styles.settingsTitleText, { color: theme.text }]}>Laporan Shift ke Email</Text>
            </View>
            <Text style={[styles.settingsDescText, { color: theme.textSecondary }]}>Kirim rekapitulasi data mesin di akhir shift kerja</Text>
          </View>
          <Switch
            value={notifyMails}
            onValueChange={setNotifyMails}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Account Info Details */}
      <Text style={[styles.profileSectionTitle, { color: theme.text }]}>Informasi Akun</Text>
      
      <View style={[styles.settingsGroupCard, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
        <View style={[styles.accountDetailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>NIK Karyawan</Text>
          <Text style={[styles.accountVal, { color: theme.text }]}>GRFD-82019-OP</Text>
        </View>
        <View style={[styles.accountDetailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Versi Aplikasi Mobile</Text>
          <Text style={[styles.accountVal, { color: theme.text }]}>v2.4.1 (Enterprise Build)</Text>
        </View>
        <View style={styles.accountDetailRow}>
          <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Terakhir Sinkronisasi</Text>
          <Text style={[styles.accountVal, { color: theme.text }]}>Baru saja (IoT Node Gateway-01)</Text>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: theme.critical }]}
        onPress={() => onNavigate('login')}
      >
        <LogOutIcon size={18} color={theme.critical} />
        <Text style={styles.logoutBtnText}>Keluar dari Sistem</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
