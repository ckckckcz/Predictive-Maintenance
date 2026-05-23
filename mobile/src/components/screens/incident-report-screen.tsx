import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '@/api/client';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Camera, Check, ChevronDown } from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './incident-report-screen.styles';
import { useMachines } from '@/hooks/use-machines';
import { useIncidents } from '@/hooks/use-incidents';
import type { IncidentSeverity } from '@/api/types';

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string; color: string; bg: string }[] = [
  { value: 'LOW', label: 'Low', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'MEDIUM', label: 'Medium', color: '#ea580c', bg: '#fffbeb' },
  { value: 'HIGH', label: 'High', color: '#dc2626', bg: '#fef2f2' },
  { value: 'CRITICAL', label: 'Critical', color: '#7c3aed', bg: '#f5f3ff' },
];

export function IncidentReportScreen({ onNavigate }: ScreenProps) {
  const theme = Colors.light;

  const { machines } = useMachines();
  const { createIncident, isSubmitting } = useIncidents();

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [showMachinePicker, setShowMachinePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [riskScore, setRiskScore] = useState('50');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  const handleSelectImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin kamera diperlukan', 'Izin kamera diperlukan untuk mengambil foto bukti!');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin galeri diperlukan', 'Izin galeri diperlukan untuk memilih foto bukti!');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      setImageUri(uri);
      setIsUploading(true);
      setValidationError('');

      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const res = await uploadFile('/upload', formData);
      setUploadedImageUrl(res.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setValidationError('Gagal mengunggah foto: ' + (err.message || err));
      setImageUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoPress = () => {
    if (Platform.OS === 'web') {
      handleSelectImage(false);
    } else {
      Alert.alert(
        'Pilih Foto Bukti',
        'Ambil foto baru menggunakan kamera atau pilih foto dari galeri.',
        [
          { text: 'Kamera', onPress: () => handleSelectImage(true) },
          { text: 'Galeri', onPress: () => handleSelectImage(false) },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedMachineId) {
      setValidationError('Pilih mesin yang bermasalah');
      return;
    }
    if (title.trim().length < 5) {
      setValidationError('Judul insiden minimal 5 karakter');
      return;
    }
    setValidationError('');

    const success = await createIncident({
      machine_id: selectedMachineId,
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
      risk_score: parseInt(riskScore, 10) || 50,
      image_url: uploadedImageUrl || undefined,
    });

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onNavigate('dashboard');
      }, 1500);
    }
  };

  return (
    <ScrollView
      style={[styles.mainScroll, { backgroundColor: '#ffffff' }]}
      contentContainerStyle={styles.reportScrollContainer}
      showsVerticalScrollIndicator={false}
    >

      <View style={{ gap: 8 }}>
        <Text style={styles.reportScreenHeader}>Lapor Insiden Baru</Text>
        <Text style={styles.reportScreenDesc}>Laporkan kerusakan atau masalah mesin langsung ke sistem maintenance pusat</Text>
      </View>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconBox}>
              <Check size={32} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Laporan Terkirim!</Text>
            <Text style={styles.successDesc}>Laporan Anda telah tercatat dan notifikasi telah dikirim ke Tim Mekanik.</Text>
          </View>
        </View>
      )}

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Foto Bukti Kerusakan</Text>
        <TouchableOpacity style={styles.photoUploadBox} onPress={handlePhotoPress} activeOpacity={0.8} disabled={isUploading}>
          {isUploading ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Mengunggah foto...</Text>
            </View>
          ) : imageUri ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
              <View style={styles.photoBadgeOver}>
                <Text style={styles.photoBadgeText}>FOTO TERPAUT</Text>
              </View>
            </View>
          ) : (
            <View style={styles.photoUploadPlaceholder}>
              <Camera size={32} color="#15803d" />
              <Text style={styles.photoUploadMainText}>Unggah atau Ambil Foto</Text>
              <Text style={styles.photoUploadSubText}>Ketuk di sini untuk mengambil foto mesin</Text>
            </View>
          )}
        </TouchableOpacity>
        {imageUri && !isUploading && (
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: -4 }}
            onPress={() => { setImageUri(null); setUploadedImageUrl(null); }}
          >
            <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '600' }}>Hapus Foto</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Pilih Mesin Bermasalah <Text style={{ color: '#dc2626' }}>*</Text></Text>
        <TouchableOpacity
          style={[styles.formTextInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setShowMachinePicker(!showMachinePicker)}
          activeOpacity={0.7}
        >
          <Text style={{ color: selectedMachine ? '#0f172a' : '#94a3b8', fontSize: 14 }}>
            {selectedMachine ? `${selectedMachine.name} (${selectedMachine.code})` : 'Pilih mesin...'}
          </Text>
          <ChevronDown size={18} color="#64748b" />
        </TouchableOpacity>

        {showMachinePicker && (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 }}>
            {machines.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                onPress={() => { setSelectedMachineId(m.id); setShowMachinePicker(false); }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{m.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{m.code} • {m.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Judul Insiden <Text style={{ color: '#dc2626' }}>*</Text></Text>
        <TextInput
          style={styles.formTextInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Suhu mesin melebihi batas normal"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Tingkat Keparahan (Severity)</Text>
        <View style={styles.severitySegmentRow}>
          {SEVERITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.severitySegment, severity === opt.value && { borderColor: opt.color, backgroundColor: opt.bg }]}
              onPress={() => setSeverity(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.severityText, severity === opt.value && { color: opt.color, fontWeight: '700' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Risk Score (0–100)</Text>
        <TextInput
          style={styles.formTextInput}
          value={riskScore}
          onChangeText={setRiskScore}
          keyboardType="numeric"
          placeholder="50"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Catatan Detail Masalah</Text>
        <TextInput
          style={styles.formTextArea}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Tuliskan detail kronologi masalah, anomali sensor, atau kode kesalahan yang muncul..."
          placeholderTextColor="#94a3b8"
        />
      </View>

      {validationError !== '' && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 12 }}>
          <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>{validationError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitReportBtn, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitReportBtnText}>Kirim Laporan Insiden</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
