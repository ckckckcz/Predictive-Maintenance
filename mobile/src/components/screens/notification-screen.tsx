import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './notification-screen.styles';
import { useIncidents } from '@/hooks/use-incidents';
import type { IncidentSeverity, IncidentStatus } from '@/api/types';

function getSeverityConfig(severity: IncidentSeverity): { label: string; color: string; bg: string } {
  switch (severity) {
    case 'CRITICAL': return { label: 'CRITICAL ALARM', color: '#dc2626', bg: '#dc262615' };
    case 'HIGH':     return { label: 'HIGH ALERT', color: '#ea580c', bg: '#fffbeb' };
    case 'MEDIUM':   return { label: 'ANOMALY WARNING', color: '#f59e0b', bg: '#fffbeb' };
    default:         return { label: 'INFORMASI', color: '#16a34a', bg: '#16a34a15' };
  }
}

function getStatusLabel(status: IncidentStatus): string {
  if (status === 'OPEN') return 'Belum ditangani';
  if (status === 'IN_PROGRESS') return 'Sedang ditangani';
  return 'Selesai';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (mins > 0) return `${mins} mnt lalu`;
  return 'Baru saja';
}

export function NotificationScreen({ onNavigate }: ScreenProps) {
  const theme = Colors.light;
  const { incidents, isLoading, refresh, acknowledgeIncident } = useIncidents({ limit: 30 });

  return (
    <ScrollView
      style={[styles.mainScroll, { backgroundColor: '#ffffff' }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#15803d" />}
    >
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
          <Text style={styles.reportScreenDesc}>Pemberitahuan alarm, deteksi anomali, dan laporan insiden</Text>
        </View>

        <View style={styles.notificationList}>
          {isLoading && incidents.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Memuat notifikasi...</Text>
            </View>
          ) : incidents.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <CheckCircle2 size={48} color="#16a34a" />
              <Text style={{ color: '#16a34a', marginTop: 12, fontSize: 15, fontWeight: '700' }}>Tidak ada insiden aktif</Text>
              <Text style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>Semua sistem berjalan normal</Text>
            </View>
          ) : (
            incidents.map((inc) => {
              const { label, color, bg } = getSeverityConfig(inc.severity);
              return (
                <TouchableOpacity
                  key={inc.id}
                  style={styles.notifItem}
                  onPress={() => onNavigate('incidentDetail', { incidentId: inc.id, incident: inc })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notifStatusMarker, { backgroundColor: color }]} />
                  <View style={styles.notifBody}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifBadgeLabel, { color, backgroundColor: bg }]}>{label}</Text>
                      <Text style={styles.notifTime}>{timeAgo(inc.created_at)}</Text>
                    </View>
                    <Text style={styles.notifTitle}>{inc.title}</Text>
                    <Text style={styles.notifDesc}>
                      {inc.machine_name} ({inc.machine_code}) — {getStatusLabel(inc.status)}
                      {inc.description ? `\n${inc.description}` : ''}
                    </Text>
                    {inc.status === 'OPEN' && (
                      <TouchableOpacity
                        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
                        onPress={(e) => {
                          e.stopPropagation(); // prevent card click navigation
                          acknowledgeIncident(inc.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <CheckCircle2 size={14} color="#15803d" />
                        <Text style={{ color: '#15803d', fontSize: 12, fontWeight: '700' }}>Akui Insiden</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
