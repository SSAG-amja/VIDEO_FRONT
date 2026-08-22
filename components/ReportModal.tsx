import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAccessory, { KEYBOARD_ACCESSORY_ID } from './KeyboardAccessory';

// 2026.08.22 임재준: 커뮤니티(게시글/댓글) 공통 신고 사유
const COMMUNITY_REPORT_REASONS = [
  '스포일러 미표기',
  '욕설, 비하 및 혐오 표현',
  '스팸, 도배 및 상업적 홍보',
  '음란물 및 불법 정보',
  '주제와 무관한 내용',
  '기타 (직접 입력)',
];

// 2026.08.22 임재준: 영화 정보 전용 신고 사유
const MOVIE_REPORT_REASONS = [
  '잘못된 영화 정보 (제목/개봉일/줄거리 등)',
  '부적절한 포스터/이미지/예고편',
  'OTT 제공처 정보 불일치',
  '중복 등록된 영화',
  '기타 (직접 입력)',
];

type Props = {
  visible: boolean;
  targetType: 'post' | 'reply' | 'movie'; // 2026.08.22 임재준: movie 타입 추가
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => Promise<void>;
};

// 2026.08.22 임재준
// 게시글, 댓글, 영화 정보에 맞게 전용 사유 목록을 제공하고 신고를 접수하는 공용 모달
export default function ReportModal({ visible, targetType, onClose, onSubmit }: Props) {
  const reasons = targetType === 'movie' ? MOVIE_REPORT_REASONS : COMMUNITY_REPORT_REASONS;

  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedReason(reasons[0]);
      setDetails('');
    }
  }, [visible, targetType]);

  const resetAndClose = () => {
    setSelectedReason(reasons[0]);
    setDetails('');
    onClose();
  };

  const getTitle = () => {
    switch (targetType) {
      case 'movie':
        return '영화 정보 신고';
      case 'reply':
        return '댓글 신고';
      case 'post':
      default:
        return '게시글 신고';
    }
  };

  const handleSubmit = async () => {
    if (selectedReason === '기타 (직접 입력)' && !details.trim()) {
      Alert.alert('확인', '신고 상세 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedReason, details.trim() || undefined);
      resetAndClose();
      Alert.alert('접수 완료', '신고가 정상적으로 접수되었습니다.');
    } catch (error: any) {
      const msg = error?.response?.status === 409 ? '이미 신고한 내역입니다.' : '신고를 접수하지 못했습니다.';
      Alert.alert('알림', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={resetAndClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={resetAndClose} />
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Pressable onPress={resetAndClose}>
              <Ionicons name="close" size={22} color="#888" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subText}>신고 사유를 선택해주세요.</Text>

            {reasons.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  style={[styles.reasonRow, isSelected && styles.reasonRowActive]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? '#FF6B4A' : '#666'}
                  />
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>{reason}</Text>
                </Pressable>
              );
            })}

            {selectedReason === '기타 (직접 입력)' && (
              <TextInput
                style={styles.detailsInput}
                placeholder="상세 내용을 입력해주세요 (최대 100자)"
                placeholderTextColor="#666"
                value={details}
                onChangeText={setDetails}
                maxLength={100}
                multiline
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={resetAndClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>신고 접수</Text>
              )}
            </Pressable>
          </View>
        </View>
        <KeyboardAccessory />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxHeight: '80%', backgroundColor: '#161616', borderRadius: 18, borderWidth: 1, borderColor: '#2b2b2b', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  body: { padding: 18 },
  subText: { color: '#888', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#1c1c1c', marginBottom: 8, borderWidth: 1, borderColor: '#242424' },
  reasonRowActive: { borderColor: '#FF6B4A', backgroundColor: 'rgba(255,107,74,0.08)' },
  reasonText: { color: '#ccc', fontSize: 13, fontWeight: '700', flex: 1 },
  reasonTextActive: { color: '#fff', fontWeight: '900' },
  detailsInput: { height: 72, borderRadius: 10, padding: 10, color: '#fff', backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#333', fontSize: 13, textAlignVertical: 'top', marginTop: 4, marginBottom: 10 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#222' },
  cancelBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  cancelBtnText: { color: '#aaa', fontSize: 14, fontWeight: '800' },
  submitBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF4D4D' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});