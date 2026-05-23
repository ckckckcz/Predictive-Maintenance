import React, { useState } from 'react';
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

export function ProfileScreen({ themeMode, setThemeMode, onNavigate }: ScreenProps) {
  const theme = Colors.light;
  const [notifyMails, setNotifyMails] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: '#ffffff' }]} contentContainerStyle={styles.profileScrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.profileScreenHeader}>My Profile</Text>
      
      {/* Profile Card Info */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarRow}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarLetter}>PW</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <TouchableOpacity style={styles.editPhotoBtn} activeOpacity={0.7}>
            <Text style={styles.editPhotoBtnText}>Edit Image</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timeInfoText}>Shift Pagi • Area Produksi A</Text>
        <Text style={styles.profileNameText}>Prasetyo Wibowo</Text>
        <Text style={styles.profileEmailText}>prasetyo.w@greenfields.com</Text>
      </View>

      {/* Side Cards Row */}
      <View style={styles.sideCardsRow}>
        {/* Left Card */}
        <View style={styles.sideCard}>
          <Text style={styles.sideCardLabel}>Supervisor</Text>
          <Text style={styles.sideCardValue}>Bambang S.</Text>
        </View>

        {/* Right Card */}
        <TouchableOpacity style={styles.sideCard} activeOpacity={0.7}>
          <View style={styles.sideCardRow}>
            <View>
              <Text style={styles.sideCardLabel}>Department</Text>
              <Text style={styles.sideCardValue}>Maintenance</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Preferensi Aplikasi */}
      <Text style={styles.settingsSectionTitle}>Preferensi Aplikasi</Text>
      <View style={styles.settingsList}>
        {/* Dark Mode */}
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

        {/* Push Alerts */}
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

        {/* Email Report */}
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

      {/* Informasi Akun */}
      <Text style={styles.settingsSectionTitle}>Informasi Akun</Text>
      <View style={styles.settingsList}>
        {/* NIK */}
        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <User size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>NIK Karyawan</Text>
          </View>
          <Text style={styles.accountValText}>GRFD-82019-OP</Text>
        </View>

        {/* App Version */}
        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <Settings size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Versi Aplikasi</Text>
          </View>
          <Text style={styles.accountValText}>v2.4.1</Text>
        </View>

        {/* Last Sync */}
        <View style={styles.settingsRow}>
          <View style={styles.notifIconBox}>
            <Info size={20} color="#0f172a" />
          </View>
          <View style={styles.settingsLabelCol}>
            <Text style={styles.settingsTitleText}>Sinkronisasi Gateway</Text>
          </View>
          <Text style={styles.accountValText}>Aktif</Text>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => onNavigate('login')}
        activeOpacity={0.8}
      >
        <LogOut size={18} color="#dc2626" />
        <Text style={styles.logoutBtnText}>Keluar dari Sistem</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
