import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import {
  ChevronLeft,
  Thermometer,
  Activity,
  Gauge,
  Zap,
  RotateCw,
  RefreshCw,
} from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './machine-detail-screen.styles';
import { useMachineDetail } from '@/hooks/use-machine-detail';
import type { Machine, SensorReading } from '@/api/types';

function getHealthPercent(machine: Machine, latest: SensorReading | null): number {
  if (machine.status === 'INACTIVE') return 20;
  if (machine.status === 'MAINTENANCE') return 55;
  if (latest?.is_anomaly) return 40;
  return latest?.efficiency ?? 95;
}

function getStatusDisplay(machine: Machine, latest: SensorReading | null): { label: string; color: string } {
  if (machine.status === 'INACTIVE') return { label: 'KRITIS', color: '#dc2626' };
  if (machine.status === 'MAINTENANCE') return { label: 'MAINTENANCE', color: '#ea580c' };
  if (latest?.is_anomaly) return { label: 'ANOMALI', color: '#dc2626' };
  return { label: 'NORMAL', color: '#16a34a' };
}

function fmt(val: number | null | undefined, unit: string, decimals = 1): string {
  if (val == null) return 'N/A';
  return `${val.toFixed(decimals)}${unit}`;
}

function SensorCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const isAlert = color === '#dc2626' || color === '#ea580c';
  return (
    <View style={styles.sensorDialCard}>
      {icon}
      <Text style={styles.sensorValText}>{value}</Text>
      <Text style={styles.sensorLabelText}>{label}</Text>
      <View style={[styles.statusIndicatorLabel, { backgroundColor: isAlert ? '#dc262615' : '#16a34a15' }]}>
        <Text style={{ color: isAlert ? '#dc2626' : '#16a34a', fontSize: 11, fontWeight: '700' }}>
          {isAlert ? 'Alert' : 'Normal'}
        </Text>
      </View>
    </View>
  );
}

export function MachineDetailScreen({ onNavigate, params = {} }: ScreenProps & { params?: any }) {
  const machineId: string = params?.machineId ?? params?.machine?.id ?? '';

  const { machine, latestSensor, sensorHistory, isLoading, error, refresh } = useMachineDetail(machineId);

  const displayMachine = machine ?? params?.machine;

  if (!machineId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#dc2626' }}>ID mesin tidak ditemukan</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={{ color: '#64748b', fontSize: 13 }}>Memuat detail mesin...</Text>
      </View>
    );
  }

  if (error || !displayMachine) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
        <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error ?? 'Mesin tidak ditemukan'}</Text>
        <TouchableOpacity onPress={refresh} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={16} color="#15803d" />
          <Text style={{ color: '#15803d', fontWeight: '600' }}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { label: statusLabel, color: statusColor } = getStatusDisplay(displayMachine, latestSensor);
  const healthPercent = getHealthPercent(displayMachine, latestSensor);

  const maxVibration = sensorHistory.length > 0
    ? Math.max(...sensorHistory.map((r) => r.vibration ?? 0))
    : 0;

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
        <Text style={styles.detailTitleText}>Detail Mesin</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.detailContentContainer}>
        <View style={styles.machineBannerCard}>
          <View style={styles.bannerHeader}>
            <View style={styles.machineMeta}>
              <Text style={styles.bannerName}>{displayMachine.name}</Text>
              <Text style={styles.bannerMeta}>{displayMachine.type} • {displayMachine.location ?? 'Tidak diketahui'}</Text>
            </View>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusBadgeDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.healthIndicatorText}>
            Tingkat Kesehatan Mesin: <Text style={{ color: statusColor, fontWeight: '800' }}>{healthPercent.toFixed(0)}%</Text>
          </Text>

          <View style={[styles.healthProgressBarBg, { backgroundColor: '#f1f5f9' }]}>
            <View style={[styles.healthProgressBarFill, { backgroundColor: statusColor, width: `${Math.min(100, healthPercent)}%` as any }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Nilai Sensor Real-time</Text>
        <View style={styles.sensorsGrid}>
          <SensorCard
            icon={<Thermometer size={24} color={latestSensor?.is_anomaly ? '#dc2626' : '#64748b'} />}
            value={fmt(latestSensor?.temperature, '°C')}
            label="Temperature (Max 90°C)"
            color={latestSensor?.is_anomaly ? '#dc2626' : '#16a34a'}
          />
          <SensorCard
            icon={<Activity size={24} color={latestSensor?.is_anomaly ? '#dc2626' : '#64748b'} />}
            value={fmt(latestSensor?.vibration, ' Hz')}
            label="Vibration (Max 50 Hz)"
            color={latestSensor?.is_anomaly ? '#dc2626' : '#16a34a'}
          />
          <SensorCard
            icon={<Gauge size={24} color="#64748b" />}
            value={fmt(latestSensor?.pressure, ' Bar')}
            label="Pressure (Max 10 Bar)"
            color="#16a34a"
          />
          <SensorCard
            icon={<RotateCw size={24} color="#64748b" />}
            value={fmt(latestSensor?.rpm, ' RPM', 0)}
            label="RPM (Max 5000)"
            color="#16a34a"
          />
          <SensorCard
            icon={<Zap size={24} color="#64748b" />}
            value={fmt(latestSensor?.efficiency, '%')}
            label="Efisiensi (Min 20%)"
            color={(latestSensor?.efficiency ?? 100) < 30 ? '#dc2626' : '#16a34a'}
          />
        </View>

        {sensorHistory.length > 0 && (
          <View style={styles.trendsChartCard}>
            <Text style={styles.chartCardTitle}>Tren Getaran (Riwayat Sensor)</Text>
            <Text style={styles.chartCardSubtitle}>{sensorHistory.length} pembacaan terakhir</Text>
            <View style={styles.chartVisualWrapper}>
              <View style={styles.chartYAxis}>
                <Text style={styles.yText}>{maxVibration.toFixed(0)}</Text>
                <Text style={styles.yText}>{(maxVibration / 2).toFixed(0)}</Text>
                <Text style={styles.yText}>0</Text>
              </View>
              <View style={styles.chartBarsContainer}>
                {sensorHistory.slice(-10).map((reading, idx) => {
                  const vib = reading.vibration ?? 0;
                  const ratio = maxVibration > 0 ? vib / maxVibration : 0;
                  const barH = Math.max(4, Math.round(ratio * 95));
                  const barColor = reading.is_anomaly ? '#dc2626' : vib > 30 ? '#ea580c' : '#16a34a';
                  return <View key={idx} style={[styles.chartBarCol, { backgroundColor: barColor, height: barH }]} />;
                })}
              </View>
            </View>
            <View style={styles.chartXLabels}>
              {sensorHistory.slice(-4).map((r, i) => (
                <Text key={i} style={styles.xText}>
                  {new Date(r.read_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.machineTableCard}>
          <Text style={styles.tableHeaderTitle}>Informasi Aset</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Kode Mesin</Text>
            <Text style={styles.tableValue}>{displayMachine.code}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Tipe Mesin</Text>
            <Text style={styles.tableValue}>{displayMachine.type}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Lokasi</Text>
            <Text style={styles.tableValue}>{displayMachine.location ?? '-'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Status API</Text>
            <Text style={styles.tableValue}>{displayMachine.status}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Anomali Terdeteksi</Text>
            <Text style={[styles.tableValue, { color: latestSensor?.is_anomaly ? '#dc2626' : '#16a34a' }]}>
              {latestSensor ? (latestSensor.is_anomaly ? 'YA — Waspada' : 'Tidak') : 'Data tidak tersedia'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
