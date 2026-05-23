import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';
import {
  ChevronLeft,
  Thermometer,
  Activity,
  Gauge,
} from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './machine-detail-screen.styles';

export function MachineDetailScreen({ onNavigate, params = {} }: ScreenProps & { params?: any }) {
  const theme = Colors.light;
  
  // Default fallback machine if parameters are empty
  const machine = params.machine || {
    name: 'CNC Milling #04',
    category: 'Milling',
    status: 'critical',
    temp: '82.4°C',
    vibr: '6.8 mm/s',
    pressure: '4.2 bar',
    location: 'Area Produksi A',
  };

  const statusColor =
    machine.status === 'healthy'
      ? '#16a34a'
      : machine.status === 'warning'
      ? '#ea580c'
      : '#dc2626';

  const healthPercent =
    machine.status === 'healthy' ? '98%' : machine.status === 'warning' ? '74%' : '32%';

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: '#ffffff' }]} showsVerticalScrollIndicator={false}>
      
      {/* Top Header Row */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('dashboard')} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#0f172a" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitleText}>Detail Mesin</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.detailContentContainer}>
        {/* Machine Core Banner */}
        <View style={styles.machineBannerCard}>
          <View style={styles.bannerHeader}>
            <View style={styles.machineMeta}>
              <Text style={styles.bannerName}>{machine.name}</Text>
              <Text style={styles.bannerMeta}>{machine.category} • {machine.location}</Text>
            </View>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusBadgeDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {machine.status === 'healthy' ? 'NORMAL' : machine.status === 'warning' ? 'WARNING' : 'KRITIS'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.healthIndicatorText}>
            Tingkat Kesehatan Mesin: <Text style={{ color: statusColor, fontWeight: '800' }}>{healthPercent}</Text>
          </Text>

          {/* Health Bar Indicator */}
          <View style={[styles.healthProgressBarBg, { backgroundColor: '#f1f5f9' }]}>
            <View
              style={[
                styles.healthProgressBarFill,
                {
                  backgroundColor: statusColor,
                  width: healthPercent,
                },
              ]}
            />
          </View>
        </View>

        {/* Real-time Sensor Values Dials Grid */}
        <Text style={styles.sectionTitle}>Nilai Sensor Real-time</Text>
        <View style={styles.sensorsGrid}>
          {/* Temperature sensor card */}
          <View style={styles.sensorDialCard}>
            <Thermometer size={24} color={machine.status === 'critical' ? '#dc2626' : '#64748b'} />
            <Text style={styles.sensorValText}>{machine.temp}</Text>
            <Text style={styles.sensorLabelText}>Temperature (Max 80°C)</Text>
            <View style={[styles.statusIndicatorLabel, { backgroundColor: machine.status === 'critical' ? '#dc262615' : '#16a34a15' }]}>
              <Text style={{ color: machine.status === 'critical' ? '#dc2626' : '#16a34a', fontSize: 11, fontWeight: '700' }}>
                {machine.status === 'critical' ? 'Spike Alert' : 'Normal'}
              </Text>
            </View>
          </View>

          {/* Vibration sensor card */}
          <View style={styles.sensorDialCard}>
            <Activity size={24} color={machine.status === 'critical' ? '#dc2626' : '#64748b'} />
            <Text style={styles.sensorValText}>{machine.vibr}</Text>
            <Text style={styles.sensorLabelText}>Vibration (Max 4.0mm/s)</Text>
            <View style={[styles.statusIndicatorLabel, { backgroundColor: machine.status === 'critical' ? '#dc262615' : '#16a34a15' }]}>
              <Text style={{ color: machine.status === 'critical' ? '#dc2626' : '#16a34a', fontSize: 11, fontWeight: '700' }}>
                {machine.status === 'critical' ? 'High Vibr' : 'Normal'}
              </Text>
            </View>
          </View>

          {/* Pressure sensor card */}
          <View style={styles.sensorDialCard}>
            <Gauge size={24} color="#64748b" />
            <Text style={styles.sensorValText}>{machine.pressure}</Text>
            <Text style={styles.sensorLabelText}>Pressure (Range 3-6 bar)</Text>
            <View style={[styles.statusIndicatorLabel, { backgroundColor: '#16a34a15' }]}>
              <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>In Range</Text>
            </View>
          </View>
        </View>

        {/* Minimal Charts Integration */}
        <View style={styles.trendsChartCard}>
          <Text style={styles.chartCardTitle}>Tren Getaran (24 Jam Terakhir)</Text>
          <Text style={styles.chartCardSubtitle}>Lonjakan tajam terdeteksi pukul 14:23</Text>
          
          {/* Custom drawing showing high resolution trends */}
          <View style={styles.chartVisualWrapper}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yText}>8.0</Text>
              <Text style={styles.yText}>4.0</Text>
              <Text style={styles.yText}>0.0</Text>
            </View>
            <View style={styles.chartBarsContainer}>
              <View style={[styles.chartBarCol, { backgroundColor: '#16a34a', height: 25 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#16a34a', height: 30 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#16a34a', height: 28 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#16a34a', height: 35 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#16a34a', height: 42 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#ea580c', height: 60 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#dc2626', height: 95 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#dc2626', height: 85 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#ea580c', height: 70 }]} />
              <View style={[styles.chartBarCol, { backgroundColor: '#ea580c', height: 48 }]} />
            </View>
          </View>
          <View style={styles.chartXLabels}>
            <Text style={styles.xText}>08:00</Text>
            <Text style={styles.xText}>12:00</Text>
            <Text style={styles.xText}>16:00</Text>
            <Text style={styles.xText}>20:00</Text>
          </View>
        </View>

        {/* Machine Information Table */}
        <View style={styles.machineTableCard}>
          <Text style={styles.tableHeaderTitle}>Informasi Aset</Text>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Model / Seri</Text>
            <Text style={styles.tableValue}>CNC-MILL-MX500</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>ID Sensor IoT</Text>
            <Text style={styles.tableValue}>NODE-A-CNC04</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Tanggal Kalibrasi</Text>
            <Text style={styles.tableValue}>12 Mar 2026</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Penanggung Jawab</Text>
            <Text style={styles.tableValue}>Bambang S. (Mekanik)</Text>
          </View>
        </View>

        {/* Status Timeline / Incident Log */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeaderTitle}>Timeline & Riwayat Perawatan</Text>
          
          <View style={styles.timelineList}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicators}>
                <View style={[styles.timelineDot, { backgroundColor: '#dc2626' }]} />
                <View style={[styles.timelineLine, { backgroundColor: '#e2e8f0' }]} />
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTimeText}>Hari Ini, 14:23</Text>
                <Text style={styles.timelineTitleText}>Pemberitahuan Anomali (Suhu Suhu 82.4°C)</Text>
                <Text style={styles.timelineDescText}>Mesin otomatis menurunkan feed-rate untuk meminimalkan kerusakan.</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicators}>
                <View style={[styles.timelineDot, { backgroundColor: '#15803d' }]} />
                <View style={[styles.timelineLine, { backgroundColor: '#e2e8f0' }]} />
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTimeText}>14 Mei 2026, 09:30</Text>
                <Text style={styles.timelineTitleText}>Servis Rutin Bulanan</Text>
                <Text style={styles.timelineDescText}>Penggantian oli lubrikasi spindel dan penyetelan ulang motor conveyor oleh Bambang S.</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicators}>
                <View style={[styles.timelineDot, { backgroundColor: '#16a34a' }]} />
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTimeText}>12 Apr 2026, 11:15</Text>
                <Text style={styles.timelineTitleText}>Kalibrasi Sensor Suhu</Text>
                <Text style={styles.timelineDescText}>Sensor dikalibrasi ke standar deviasi +/- 0.1°C.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}
