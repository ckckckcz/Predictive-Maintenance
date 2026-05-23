import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch } from 'react-native';
import { Colors } from '@/constants/theme';
import {
  Moon,
  Sun,
  Bell,
  FileText,
  LogOut,
  ChevronRight,
  User,
  Settings,
  Info,
} from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './profile-screen.styles';
import { useAuth } from '@/hooks/use-auth';
import { getMe } from '@/api/auth';
import type { UserPublic } from '@/api/types';

export function ProfileScreen({ themeMode, setThemeMode, onNavigate }: ScreenProps) {
  const theme = Colors.light;
  const [notifyMails, setNotifyMails] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [profile, setProfile] = useState<UserPublic | null>(null);

  const { logout } = useAuth();

  useEffect(() => {
    getMe().then(setProfile).catch(() => null);
  }, []);

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OP';

  return (
    <ScrollView
      style={[styles.mainScroll, { backgroundColor: '#ffffff' }]}
      contentContainerStyle={styles.profileScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.profileScreenHeader}>My Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatarRow}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarLetter}>{initials}</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <TouchableOpacity style={styles.editPhotoBtn} activeOpacity={0.7}>
            <Text style={styles.editPhotoBtnText}>Edit Image</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timeInfoText}>
          {profile?.role === 'OPERATOR' ? 'Operator' : 'Supervisor'} • {profile?.is_active ? 'Aktif' : 'Nonaktif'}
        </Text>
        <Text style={styles.profileNameText}>{profile?.name ?? '—'}</Text>
        <Text style={styles.profileEmailText}>{profile?.email ?? '—'}</Text>
      </View>

      <View style={styles.sideCardsRow}>
        <View style={styles.sideCard}>
          <Text style={styles.sideCardLabel}>Role</Text>
          <Text style={styles.sideCardValue}>{profile?.role ?? '—'}</Text>
        </View>

        <TouchableOpacity style={styles.sideCard} activeOpacity={0.7}>
          <View style={styles.sideCardRow}>
            <View>
              <Text style={styles.sideCardLabel}>Telepon</Text>
              <Text style={styles.sideCardValue}>{profile?.phone ?? 'Belum diisi'}</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.settingsSectionTitle}>Preferensi Aplikasi</Text>
      <View style={styles.settingsList}>
        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            {themeMode === 'dark' ? <Moon size={20} color="#0f172a" /> : <Sun size={20} color="#0f172a" />}
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Mode Gelap (Dark Mode)</Text>
            <Text style={styles.settingsDescText}>Aktifkan tema gelap untuk area redup</Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(val) => setThemeMode && setThemeMode(val ? 'dark' : 'light')}
            trackColor={{ false: '#e2e8f0', true: '#15803d' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <Bell size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Alarm & Notifikasi Push</Text>
            <Text style={styles.settingsDescText}>Terima deteksi anomali secara instan</Text>
          </View>
          <Switch
            value={notifyPush}
            onValueChange={setNotifyPush}
            trackColor={{ false: '#e2e8f0', true: '#15803d' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <FileText size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Laporan Shift ke Email</Text>
            <Text style={styles.settingsDescText}>Kirim rekap data di akhir shift kerja</Text>
          </View>
          <Switch
            value={notifyMails}
            onValueChange={setNotifyMails}
            trackColor={{ false: '#e2e8f0', true: '#15803d' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <Text style={styles.settingsSectionTitle}>Informasi Akun</Text>
      <View style={styles.settingsList}>
        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <User size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>ID Pengguna</Text>
          </View>
          <Text style={styles.accountValText}>{profile?.id?.slice(0, 8) ?? '—'}</Text>
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <Settings size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Versi Aplikasi</Text>
          </View>
          <Text style={styles.accountValText}>v1.0.0</Text>
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <Info size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Status Akun</Text>
          </View>
          <Text style={[styles.accountValText, { color: profile?.is_active ? '#16a34a' : '#dc2626' }]}>
            {profile?.is_active ? 'Aktif' : 'Nonaktif'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color="#dc2626" />
        <Text style={styles.logoutBtnText}>Keluar dari Sistem</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
