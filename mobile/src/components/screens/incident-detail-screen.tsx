import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { ChevronLeft, Send, CheckCircle2, MessageCircle, AlertCircle, Play } from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './incident-detail-screen.styles';
import { apiRequest } from '@/api/client';
import type { IncidentWithDetails, IncidentStatus } from '@/api/types';

interface IncidentReply {
  id: string;
  incident_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name: string;
  user_role: string;
}

export function IncidentDetailScreen({
  onNavigate,
  params,
  user,
}: ScreenProps & { params?: { incidentId: string; incident?: IncidentWithDetails } }) {
  const incidentId = params?.incidentId;
  const [incident, setIncident] = useState<IncidentWithDetails | null>(params?.incident ?? null);
  const [replies, setReplies] = useState<IncidentReply[]>([]);
  const [loading, setLoading] = useState(!params?.incident);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [messageText, setMessageText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const loadIncidentDetails = async () => {
    if (!incidentId) return;
    try {
      const data = await apiRequest<IncidentWithDetails>(`/incidents/${incidentId}`);
      setIncident(data);
    } catch (err) {
      console.error('Gagal memuat detail insiden:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    if (!incidentId) return;
    try {
      const data = await apiRequest<IncidentReply[]>(`/incidents/${incidentId}/replies`);
      setReplies(data || []);
    } catch (err) {
      console.error('Gagal memuat balasan:', err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadIncidentDetails(), loadReplies()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadIncidentDetails();
    loadReplies();
  }, [incidentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [replies]);

  const handleSendReply = async (customStatus?: IncidentStatus, customMsg?: string) => {
    if (!incidentId) return;
    const trimMsg = messageText.trim();
    if (!trimMsg && !customStatus) return;

    setSubmittingReply(true);
    try {
      const finalMsg = customMsg ?? trimMsg;
      const body: any = { message: finalMsg };
      if (customStatus) {
        body.status = customStatus;
      }

      const newReply = await apiRequest<IncidentReply>(`/incidents/${incidentId}/replies`, {
        method: 'POST',
        body,
      });

      setReplies((prev) => [...prev, newReply]);
      setMessageText('');

      // If status changed, update the local incident status
      if (customStatus && incident) {
        setIncident({ ...incident, status: customStatus });
      }
    } catch (err) {
      console.error('Gagal mengirim balasan:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getSeverityColors = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { color: '#dc2626', bg: '#dc262615', label: 'KRITIS' };
      case 'HIGH':
        return { color: '#ea580c', bg: '#ea580c15', label: 'TINGGI' };
      case 'MEDIUM':
        return { color: '#f59e0b', bg: '#f59e0b15', label: 'SEDANG' };
      default:
        return { color: '#16a34a', bg: '#16a34a15', label: 'RENDAH' };
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return { color: '#16a34a', bg: '#16a34a15', label: 'SELESAI' };
      case 'IN_PROGRESS':
        return { color: '#d97706', bg: '#d9770615', label: 'PROSES' };
      default:
        return { color: '#dc2626', bg: '#dc262615', label: 'OPEN' };
    }
  };

  if (loading || !incident) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>Memuat data insiden...</Text>
      </View>
    );
  }

  const sevConfig = getSeverityColors(incident.severity);
  const statusConfig = getStatusColors(incident.status);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('notifications')} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#0f172a" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Laporan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
        }
      >
        {/* Detail Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <Text style={[styles.severityBadge, { color: sevConfig.color, backgroundColor: sevConfig.bg }]}>
              {sevConfig.label}
            </Text>
            <Text style={[styles.statusBadge, { color: statusConfig.color, backgroundColor: statusConfig.bg }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.infoTitle}>{incident.title}</Text>
          {incident.description && (
            <Text style={styles.infoDesc}>{incident.description}</Text>
          )}
          <View style={styles.infoFooter}>
            <Text style={styles.machineText}>Mesin: {incident.machine_name} ({incident.machine_code})</Text>
            <Text style={styles.timeText}>{new Date(incident.created_at).toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* Action Buttons based on Status */}
        {incident.status === 'OPEN' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ea580c' }]}
              onPress={() => handleSendReply('IN_PROGRESS', 'Mulai menindaklanjuti insiden (Diakui Operator)')}
              disabled={submittingReply}
              activeOpacity={0.8}
            >
              <Play size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Akui & Proses</Text>
            </TouchableOpacity>
          </View>
        )}

        {incident.status === 'IN_PROGRESS' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => handleSendReply('RESOLVED', 'Masalah selesai diperbaiki dan normal kembali (Diselesaikan Operator)')}
              disabled={submittingReply}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Selesaikan Insiden</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Section Title */}
        <Text style={styles.sectionTitle}>Riwayat Balasan & Arahan</Text>

        {/* Chat History List */}
        <View style={styles.chatArea}>
          {repliesLoading ? (
            <ActivityIndicator size="small" color="#15803d" />
          ) : replies.length === 0 ? (
            <View style={styles.chatEmpty}>
              <MessageCircle size={32} color="#cbd5e1" />
              <Text style={styles.chatEmptyText}>Belum ada tanggapan</Text>
              <Text style={styles.chatEmptySub}>Berikan arahan atau respon awal dengan mengetik pesan di bawah.</Text>
            </View>
          ) : (
            replies.map((reply) => {
              const isMe = reply.user_id === user?.id;
              return (
                <View
                  key={reply.id}
                  style={[
                    styles.bubble,
                    isMe ? styles.myBubble : styles.otherBubble,
                  ]}
                >
                  <View style={styles.bubbleSenderRow}>
                    <Text
                      style={[
                        styles.bubbleSender,
                        isMe ? styles.mySender : styles.otherSender,
                      ]}
                    >
                      {reply.user_name}
                    </Text>
                    <Text
                      style={[
                        styles.roleBadge,
                        isMe ? styles.myRoleBadge : styles.otherRoleBadge,
                      ]}
                    >
                      {reply.user_role}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.myBubbleText : styles.otherBubbleText,
                    ]}
                  >
                    {reply.message}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleTime,
                      isMe ? styles.myBubbleTime : styles.otherBubbleTime,
                    ]}
                  >
                    {new Date(reply.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Message Input Footer */}
      {incident.status !== 'RESOLVED' && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Tulis balasan atau update..."
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!messageText.trim() || submittingReply) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSendReply()}
            disabled={!messageText.trim() || submittingReply}
            activeOpacity={0.8}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
