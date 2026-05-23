import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './notification-screen.styles';

export function NotificationScreen({ onNavigate }: ScreenProps) {
  const theme = Colors.light;

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: '#ffffff' }]} showsVerticalScrollIndicator={false}>
      
      {/* Top Header Row */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('dashboard')} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#0f172a" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitleText}>Notifikasi & Alarm</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.notificationsContainer}>
        <View style={{ gap: 8 }}>
          <Text style={styles.reportScreenHeader}>Notifikasi & Alarm</Text>
          <Text style={styles.reportScreenDesc}>Pemberitahuan alarm, deteksi anomali, dan penugasan maintenance</Text>
        </View>

        <View style={styles.notificationList}>
          {/* Critical alert */}
          <View style={styles.notifItem}>
            <View style={[styles.notifStatusMarker, { backgroundColor: '#dc2626' }]} />
            <View style={styles.notifBody}>
              <View style={styles.notifHeaderRow}>
                <Text style={[styles.notifBadgeLabel, { color: '#dc2626', backgroundColor: '#dc262615' }]}>CRITICAL ALARM</Text>
                <Text style={styles.notifTime}>14:23</Text>
              </View>
              <Text style={styles.notifTitle}>Suhu Ekstrim CNC Milling #04</Text>
              <Text style={styles.notifDesc}>Sensor mendeteksi suhu melebihi batas operasional (82.4°C / Max 80°C). Segera periksa kipas pendingin.</Text>
            </View>
          </View>

          {/* Warning Alert */}
          <View style={styles.notifItem}>
            <View style={[styles.notifStatusMarker, { backgroundColor: '#ea580c' }]} />
            <View style={styles.notifBody}>
              <View style={styles.notifHeaderRow}>
                <Text style={[styles.notifBadgeLabel, { color: '#ea580c', backgroundColor: '#fffbeb' }]}>ANOMALY WARNING</Text>
                <Text style={styles.notifTime}>11:05</Text>
              </View>
              <Text style={styles.notifTitle}>Getaran Tidak Stabil Hydraulic Pump #02</Text>
              <Text style={styles.notifDesc}>Getaran pada motor pompa meningkat ke 3.1 mm/s. Status diubah ke siaga (Warning).</Text>
            </View>
          </View>

          {/* Maintenance Reminder */}
          <View style={styles.notifItem}>
            <View style={[styles.notifStatusMarker, { backgroundColor: '#15803d' }]} />
            <View style={styles.notifBody}>
              <View style={styles.notifHeaderRow}>
                <Text style={[styles.notifBadgeLabel, { color: '#15803d', backgroundColor: '#f0fdf4' }]}>MAINTENANCE REMINDER</Text>
                <Text style={styles.notifTime}>Kemarin, 08:00</Text>
              </View>
              <Text style={styles.notifTitle}>Jadwal Kalibrasi Mingguan Conveyor A</Text>
              <Text style={styles.notifDesc}>Pengingat rutin kalibrasi sensor kecepatan dan encoder conveyor line A agar presisi output tetap terjaga.</Text>
            </View>
          </View>

          {/* Informational Notification */}
          <View style={styles.notifItem}>
            <View style={[styles.notifStatusMarker, { backgroundColor: '#16a34a' }]} />
            <View style={styles.notifBody}>
              <View style={styles.notifHeaderRow}>
                <Text style={[styles.notifBadgeLabel, { color: '#16a34a', backgroundColor: '#16a34a15' }]}>SYSTEM STABLE</Text>
                <Text style={styles.notifTime}>22 Mei, 06:12</Text>
              </View>
              <Text style={styles.notifTitle}>Konektivitas IoT Gateway Pulih</Text>
              <Text style={styles.notifDesc}>Semua sensor IoT node di Area B berhasil melakukan sinkronisasi ulang data parameter pasca pemeliharaan server.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
