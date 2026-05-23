import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  Bell,
  Plus,
  ArrowUpRight,
  Thermometer,
  Activity,
  Gauge as GaugeIcon,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './dashboard-screen.styles';

const INITIAL_MACHINES = [
  { id: '1', name: 'CNC Milling #04', category: 'Milling', status: 'critical', temp: '82.4°C', vibr: '6.8 mm/s', pressure: '4.2 bar', location: 'Area Produksi A' },
  { id: '2', name: 'Hydraulic Pump #02', category: 'Hydraulic', status: 'warning', temp: '64.1°C', vibr: '3.1 mm/s', pressure: '5.9 bar', location: 'Area Produksi B' },
  { id: '3', name: 'Injection Molder #01', category: 'Molding', status: 'healthy', temp: '42.8°C', vibr: '1.2 mm/s', pressure: '3.1 bar', location: 'Area Produksi C' },
  { id: '4', name: 'Conveyor Motor #03', category: 'Logistics', status: 'healthy', temp: '38.2°C', vibr: '0.9 mm/s', pressure: '0.0 bar', location: 'Area Assembly' },
];

export function DashboardScreen({ onNavigate, demoIncidents = [] }: ScreenProps) {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filteredMachines = INITIAL_MACHINES.filter((machine) => {
    if (activeCategory === 'Semua') return true;
    if (activeCategory === 'Kritis') return machine.status === 'critical';
    if (activeCategory === 'Warning') return machine.status === 'warning';
    if (activeCategory === 'Normal') return machine.status === 'healthy';
    return true;
  });

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: '#ffffff' }]} contentContainerStyle={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
      
      {/* Header Row */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => onNavigate('profile')}>
            <Text style={styles.avatarText}>PW</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.dashboardGreeting}>Selamat bertugas,</Text>
            <Text style={styles.dashboardUserName}>Prasetyo W.</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleButtonBlack} onPress={() => onNavigate('incidentReport')}>
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.circleButtonWhite} onPress={() => onNavigate('notifications')}>
            <Bell size={20} color="#0f172a" />
            <View style={styles.badgeIndicator} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Section & Category Filter */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Status Kesehatan</Text>
        <Text style={styles.seeAllText}>Mesin Aktif</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {['Semua', 'Kritis', 'Warning', 'Normal'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              activeCategory === cat ? styles.categoryPillActive : null
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === cat ? styles.categoryPillTextActive : null
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid Overview Cards (Like User Reference) */}
      <View style={styles.overviewGrid}>
        {/* Big Card - Critical Alerts */}
        <TouchableOpacity
          style={[styles.bigOverviewCard, { backgroundColor: '#dc2626' }]}
          onPress={() => onNavigate('notifications')}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.bigCardTitle}>Status Bahaya (Kritis)</Text>
            <View style={styles.whiteArrowCircle}>
              <ArrowUpRight size={18} color="#ffffff" />
            </View>
          </View>
          <View style={styles.bigCardValueContainer}>
            <Text style={styles.bigCardValue}>1</Text>
            <Text style={styles.bigCardSub}>CNC Milling #04 - Suhu 82.4°C Kritis</Text>
          </View>
        </TouchableOpacity>

        {/* Small Cards Row */}
        <View style={styles.smallCardsRow}>
          {/* Left Small Card */}
          <TouchableOpacity
            style={styles.smallOverviewCard}
            onPress={() => setActiveCategory('Normal')}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.smallCardTitle}>Mesin Normal</Text>
              <View style={styles.primaryArrowCircle}>
                <ArrowUpRight size={16} color="#15803d" />
              </View>
            </View>
            <View style={styles.smallCardValueContainer}>
              <Text style={styles.smallCardValue}>2</Text>
              <Text style={styles.smallCardSub}>Sistem Aman</Text>
            </View>
          </TouchableOpacity>

          {/* Right Small Card */}
          <TouchableOpacity
            style={styles.smallOverviewCard}
            onPress={() => setActiveCategory('Warning')}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.smallCardTitle}>Mesin Warning</Text>
              <View style={styles.warningArrowCircle}>
                <ArrowUpRight size={16} color="#d97706" />
              </View>
            </View>
            <View style={styles.smallCardValueContainer}>
              <Text style={styles.smallCardValue}>1</Text>
              <Text style={styles.smallCardSub}>Perlu Atensi</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Productivity & Chart Row (Like User Reference) */}
      <View style={styles.productivityRow}>
        {/* Left Widget: Health Gauge */}
        <View style={styles.productivityCard}>
          <Text style={styles.productivityCardTitle}>Efisiensi Pabrik</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.customGaugeWrapper}>
              <View style={styles.customGaugeBg} />
              <View style={styles.customGaugeFill} />
              <Text style={styles.gaugeValueText}>92%</Text>
            </View>
            <Text style={styles.gaugeSub}>Sistem Berjalan Optimal</Text>
          </View>
        </View>

        {/* Right Widget: Daily Bar Chart */}
        <View style={styles.productivityCard}>
          <Text style={styles.productivityCardTitle}>Insiden (Minggu Ini)</Text>
          <View style={styles.chartContainer}>
            {[
              { label: 'S', h: 10, act: false },
              { label: 'M', h: 18, act: false },
              { label: 'T', h: 8, act: false },
              { label: 'W', h: 48, act: true },
              { label: 'T', h: 14, act: false },
            ].map((bar, idx) => (
              <View key={idx} style={styles.chartBarGroup}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: bar.h,
                      backgroundColor: bar.act ? '#15803d' : '#e2e8f0',
                    },
                  ]}
                />
                <Text style={styles.chartBarLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Daftar Mesin */}
      <View style={styles.machinesSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0 }]}>Daftar Mesin</Text>
          <Text style={styles.seeAllText}>Total: {filteredMachines.length}</Text>
        </View>

        {filteredMachines.map((machine) => {
          const statusColor =
            machine.status === 'healthy'
              ? '#16a34a'
              : machine.status === 'warning'
              ? '#ea580c'
              : '#dc2626';
          
          return (
            <TouchableOpacity
              key={machine.id}
              style={styles.machineCard}
              onPress={() => onNavigate('machineDetail', { machine })}
            >
              <View style={styles.machineCardHeader}>
                <View style={styles.machineMeta}>
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.machineCategory}>{machine.category} • {machine.location}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <View style={[styles.statusBadgeDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {machine.status === 'healthy' ? 'Normal' : machine.status === 'warning' ? 'Warning' : 'Kritis'}
                  </Text>
                </View>
              </View>

              {/* Metrics Row */}
              <View style={styles.machineMetricsRow}>
                <View style={styles.machineMetric}>
                  <Thermometer size={16} color="#64748b" />
                  <Text style={styles.machineMetricText}>{machine.temp}</Text>
                </View>
                <View style={styles.machineMetric}>
                  <Activity size={16} color="#64748b" />
                  <Text style={styles.machineMetricText}>{machine.vibr}</Text>
                </View>
                <View style={styles.machineMetric}>
                  <GaugeIcon size={16} color="#64748b" />
                  <Text style={styles.machineMetricText}>{machine.pressure}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Incidents Section */}
      <View style={styles.incidentsSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0 }]}>Insiden Terbaru</Text>
        </View>

        {/* Static incidents */}
        <View style={styles.incidentListItem}>
          <View style={[styles.incidentCategoryIndicator, { backgroundColor: '#dc2626' }]} />
          <View style={styles.incidentListBody}>
            <Text style={styles.incidentListTitle}>Temperature Spike (Overheating)</Text>
            <Text style={styles.incidentListSub}>CNC Milling #04 • 15 mnt yang lalu</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: '#dc262615' }]}>
            <Text style={[styles.severityBadgeText, { color: '#dc2626' }]}>High</Text>
          </View>
        </View>

        {demoIncidents.map((inc, i) => (
          <View key={i} style={styles.incidentListItem}>
            <View
              style={[
                styles.incidentCategoryIndicator,
                {
                  backgroundColor:
                    inc.severity === 'High'
                      ? '#dc2626'
                      : inc.severity === 'Medium'
                      ? '#ea580c'
                      : '#16a34a',
                },
              ]}
            />
            <View style={styles.incidentListBody}>
              <Text style={styles.incidentListTitle}>{inc.category} Report</Text>
              <Text style={styles.incidentListSub}>{inc.machineName} • Baru saja</Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                {
                  backgroundColor:
                    (inc.severity === 'High'
                      ? '#dc2626'
                      : inc.severity === 'Medium'
                      ? '#ea580c'
                      : '#16a34a') + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.severityBadgeText,
                  {
                    color:
                      inc.severity === 'High'
                        ? '#dc2626'
                        : inc.severity === 'Medium'
                        ? '#ea580c'
                        : '#16a34a',
                  },
                ]}
              >
                {inc.severity}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.incidentListItem}>
          <View style={[styles.incidentCategoryIndicator, { backgroundColor: '#ea580c' }]} />
          <View style={styles.incidentListBody}>
            <Text style={styles.incidentListTitle}>Vibration Threshold Exceeded</Text>
            <Text style={styles.incidentListSub}>Hydraulic Pump #02 • 2 jam yang lalu</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: '#ea580c15' }]}>
            <Text style={[styles.severityBadgeText, { color: '#ea580c' }]}>Med</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}
