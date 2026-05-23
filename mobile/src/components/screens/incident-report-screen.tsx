import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import { ScreenProps } from './types';
import { styles } from './incident-report-screen.styles';

export function IncidentReportScreen({ onNavigate, addDemoIncident }: ScreenProps) {
  const theme = Colors.light;
  
  const [machineName, setMachineName] = useState('CNC Milling #04');
  const [category, setCategory] = useState('Overheating / Suhu Tinggi');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('High');
  const [notes, setNotes] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      if (addDemoIncident) {
        addDemoIncident({
          machineName,
          category,
          severity,
          notes,
        });
      }
      setTimeout(() => {
        setShowSuccess(false);
        onNavigate('dashboard');
      }, 1500);
    }, 1500);
  };

  return (
    <ScrollView style={[styles.mainScroll, { backgroundColor: '#ffffff' }]} contentContainerStyle={styles.reportScrollContainer} showsVerticalScrollIndicator={false}>
      
      {/* Header Row */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('dashboard')} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#0f172a" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitleText}>Lapor Insiden</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.reportScreenHeader}>Lapor Insiden Baru</Text>
        <Text style={styles.reportScreenDesc}>Laporkan kerusakan atau masalah mesin langsung ke sistem maintenance pusat</Text>
      </View>

      {/* Success Modal Simulation */}
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

      {/* Photo Uploader */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Foto Bukti Kerusakan</Text>
        
        <TouchableOpacity
          style={styles.photoUploadBox}
          onPress={() => setPhotoTaken(!photoTaken)}
          activeOpacity={0.8}
        >
          {photoTaken ? (
            <View style={styles.photoPreviewWrapper}>
              <Image
                source={require('@/assets/images/factory.png')}
                style={styles.photoPreview}
                resizeMode="cover"
              />
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
      </View>

      {/* Machine selector */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Pilih Mesin Bermasalah</Text>
        <TextInput
          style={styles.formTextInput}
          value={machineName}
          onChangeText={setMachineName}
          placeholder="Contoh: CNC Milling #04"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Category Dropdown representation */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Kategori Masalah</Text>
        <TextInput
          style={styles.formTextInput}
          value={category}
          onChangeText={setCategory}
          placeholder="Contoh: Overheating"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Severity selection segments */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Tingkat Keparahan (Severity)</Text>
        <View style={styles.severitySegmentRow}>
          <TouchableOpacity
            style={[
              styles.severitySegment,
              severity === 'Low' && { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
            ]}
            onPress={() => setSeverity('Low')}
            activeOpacity={0.7}
          >
            <Text style={[styles.severityText, severity === 'Low' && { color: '#16a34a', fontWeight: '700' }]}>Low</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.severitySegment,
              severity === 'Medium' && { borderColor: '#ea580c', backgroundColor: '#fffbeb' },
            ]}
            onPress={() => setSeverity('Medium')}
            activeOpacity={0.7}
          >
            <Text style={[styles.severityText, severity === 'Medium' && { color: '#ea580c', fontWeight: '700' }]}>Medium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.severitySegment,
              severity === 'High' && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
            ]}
            onPress={() => setSeverity('High')}
            activeOpacity={0.7}
          >
            <Text style={[styles.severityText, severity === 'High' && { color: '#dc2626', fontWeight: '700' }]}>High</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes / Deskripsi field */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Catatan Detail Masalah</Text>
        <TextInput
          style={styles.formTextArea}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Tuliskan detail kronologi masalah, anomali sensor, atau kode kesalahan yang muncul..."
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Submit Report Button */}
      <TouchableOpacity
        style={styles.submitReportBtn}
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
