import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  Bell,
  Plus,
  ArrowUpRight,
  Thermometer,
  Activity,
  Gauge as GaugeIcon,
  RefreshCw,
} from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './dashboard-screen.styles';
import { useMachines } from '@/hooks/use-machines';
import { useIncidents } from '@/hooks/use-incidents';
import type { Machine } from '@/api/types';

function getMachineDisplayStatus(machine: Machine): 'critical' | 'warning' | 'healthy' {
  if (machine.status === 'INACTIVE') return 'critical';
  if (machine.status === 'MAINTENANCE') return 'warning';
  return 'healthy';
}

function getStatusColor(status: 'critical' | 'warning' | 'healthy'): string {
  if (status === 'critical') return '#dc2626';
  if (status === 'warning') return '#ea580c';
  return '#16a34a';
}

export function DashboardScreen({ onNavigate, user }: ScreenProps & { user?: { name: string } | null }) {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [refreshing, setRefreshing] = useState(false);

  const { machines, isLoading: machinesLoading, error: machinesError, refresh: refreshMachines } = useMachines();
  const { incidents, stats, isLoading: incidentsLoading, refresh: refreshIncidents } = useIncidents({ limit: 5 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshMachines(), refreshIncidents()]);
    setRefreshing(false);
  };

  const filteredMachines = machines.filter((machine) => {
    const displayStatus = getMachineDisplayStatus(machine);
    if (activeCategory === 'Semua') return true;
    if (activeCategory === 'Kritis') return displayStatus === 'critical';
    if (activeCategory === 'Warning') return displayStatus === 'warning';
    if (activeCategory === 'Normal') return displayStatus === 'healthy';
    return true;
  });

  const normalCount = machines.filter((m) => getMachineDisplayStatus(m) === 'healthy').length;
  const warningCount = machines.filter((m) => getMachineDisplayStatus(m) === 'warning').length;
  const criticalCount = machines.filter((m) => getMachineDisplayStatus(m) === 'critical').length;

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OP';

  const firstName = user?.name ? user.name.split(' ')[0] : 'Operator';

  const isLoading = machinesLoading || incidentsLoading;

  return (
    <ScrollView
      style={[styles.mainScroll, { backgroundColor: '#ffffff' }]}
      contentContainerStyle={styles.dashboardContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" />}
    >
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => onNavigate('profile')}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.dashboardGreeting}>Selamat bertugas,</Text>
            <Text style={styles.dashboardUserName}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleButtonBlack} onPress={() => onNavigate('incidentReport')}>
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleButtonWhite} onPress={() => onNavigate('notifications')}>
            <Bell size={20} color="#0f172a" />
            {(stats?.open ?? 0) > 0 && <View style={styles.badgeIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Memuat data mesin...</Text>
        </View>
      ) : machinesError ? (
        <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{machinesError}</Text>
          <TouchableOpacity onPress={onRefresh} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} color="#15803d" />
            <Text style={{ color: '#15803d', fontWeight: '600' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.overviewGrid}>
            <TouchableOpacity
              style={[styles.bigOverviewCard, { backgroundColor: criticalCount > 0 ? '#dc2626' : '#15803d' }]}
              onPress={() => onNavigate('notifications')}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.bigCardTitle}>{criticalCount > 0 ? 'Status Bahaya (Kritis)' : 'Semua Mesin Normal'}</Text>
                <View style={styles.whiteArrowCircle}>
                  <ArrowUpRight size={18} color="#ffffff" />
                </View>
              </View>
              <View style={styles.bigCardValueContainer}>
                <Text style={styles.bigCardValue}>{criticalCount > 0 ? criticalCount : machines.length}</Text>
                <Text style={styles.bigCardSub}>
                  {criticalCount > 0 ? `${criticalCount} mesin dalam kondisi kritis` : 'Sistem berjalan normal'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.smallCardsRow}>
              <TouchableOpacity style={styles.smallOverviewCard} onPress={() => setActiveCategory('Normal')}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.smallCardTitle}>Mesin Normal</Text>
                  <View style={styles.primaryArrowCircle}>
                    <ArrowUpRight size={16} color="#15803d" />
                  </View>
                </View>
                <View style={styles.smallCardValueContainer}>
                  <Text style={styles.smallCardValue}>{normalCount}</Text>
                  <Text style={styles.smallCardSub}>Sistem Aman</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.smallOverviewCard} onPress={() => setActiveCategory('Warning')}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.smallCardTitle}>Mesin Warning</Text>
                  <View style={styles.warningArrowCircle}>
                    <ArrowUpRight size={16} color="#d97706" />
                  </View>
                </View>
                <View style={styles.smallCardValueContainer}>
                  <Text style={styles.smallCardValue}>{warningCount}</Text>
                  <Text style={styles.smallCardSub}>Perlu Atensi</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.productivityRow}>
            <View style={styles.productivityCard}>
              <Text style={styles.productivityCardTitle}>Insiden (Total)</Text>
              <View style={styles.gaugeContainer}>
                <View style={styles.customGaugeWrapper}>
                  <View style={styles.customGaugeBg} />
                  <View style={styles.customGaugeFill} />
                  <Text style={styles.gaugeValueText}>{stats?.open ?? 0}</Text>
                </View>
                <Text style={styles.gaugeSub}>Insiden Belum Ditangani</Text>
              </View>
            </View>

            <View style={styles.productivityCard}>
              <Text style={styles.productivityCardTitle}>Insiden (Minggu Ini)</Text>
              <View style={styles.chartContainer}>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev, idx) => {
                  const count = sev === 'LOW' ? (stats?.low ?? 0) : sev === 'MEDIUM' ? (stats?.medium ?? 0) : sev === 'HIGH' ? (stats?.high ?? 0) : (stats?.critical ?? 0);
                  const maxVal = Math.max(stats?.low ?? 1, stats?.medium ?? 1, stats?.high ?? 1, stats?.critical ?? 1, 1);
                  const barH = Math.max(8, Math.round((count / maxVal) * 48));
                  const barColor = sev === 'CRITICAL' ? '#dc2626' : sev === 'HIGH' ? '#ea580c' : sev === 'MEDIUM' ? '#f59e0b' : '#15803d';
                  return (
                    <View key={idx} style={styles.chartBarGroup}>
                      <View style={[styles.chartBar, { height: barH, backgroundColor: count > 0 ? barColor : '#e2e8f0' }]} />
                      <Text style={styles.chartBarLabel}>{sev[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.machinesSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0 }]}>Daftar Mesin</Text>
              <Text style={styles.seeAllText}>Total: {filteredMachines.length}</Text>
            </View>

            {filteredMachines.map((machine) => {
              const displayStatus = getMachineDisplayStatus(machine);
              const statusColor = getStatusColor(displayStatus);
              return (
                <TouchableOpacity
                  key={machine.id}
                  style={styles.machineCard}
                  onPress={() => onNavigate('machineDetail', { machineId: machine.id, machine })}
                >
                  <View style={styles.machineCardHeader}>
                    <View style={styles.machineMeta}>
                      <Text style={styles.machineName}>{machine.name}</Text>
                      <Text style={styles.machineCategory}>{machine.type} • {machine.location ?? 'Tidak diketahui'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                      <View style={[styles.statusBadgeDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {displayStatus === 'healthy' ? 'Normal' : displayStatus === 'warning' ? 'Warning' : 'Kritis'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.machineMetricsRow}>
                    <View style={styles.machineMetric}>
                      <Thermometer size={16} color="#64748b" />
                      <Text style={styles.machineMetricText}>{machine.code}</Text>
                    </View>
                    <View style={styles.machineMetric}>
                      <Activity size={16} color="#64748b" />
                      <Text style={styles.machineMetricText}>{machine.status}</Text>
                    </View>
                    <View style={styles.machineMetric}>
                      <GaugeIcon size={16} color="#64748b" />
                      <Text style={styles.machineMetricText}>{machine.type}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.incidentsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0 }]}>Insiden Terbaru</Text>
            </View>

            {incidents.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: '#64748b', fontSize: 13 }}>Tidak ada insiden terbaru</Text>
              </View>
            ) : (
              incidents.slice(0, 5).map((inc) => {
                const sevColor =
                  inc.severity === 'CRITICAL' ? '#dc2626' :
                    inc.severity === 'HIGH' ? '#ea580c' :
                      inc.severity === 'MEDIUM' ? '#f59e0b' : '#16a34a';
                return (
                  <TouchableOpacity
                    key={inc.id}
                    style={styles.incidentListItem}
                    onPress={() => onNavigate('incidentDetail', { incidentId: inc.id, incident: inc })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.incidentCategoryIndicator, { backgroundColor: sevColor }]} />
                    <View style={styles.incidentListBody}>
                      <Text style={styles.incidentListTitle}>{inc.title}</Text>
                      <Text style={styles.incidentListSub}>{inc.machine_name} • {new Date(inc.created_at).toLocaleDateString('id-ID')}</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sevColor + '15' }]}>
                      <Text style={[styles.severityBadgeText, { color: sevColor }]}>{inc.severity}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
