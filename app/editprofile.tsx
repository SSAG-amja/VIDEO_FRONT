import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// ⚠️ 위에서 추가한 API를 임포트합니다. 경로에 맞게 수정하세요.
import { getUserProfileApi, updateUserProfileApi } from '../api/user';

// --- 커스텀 데이트 피커 모달 컴포넌트 (iOS용) ---
interface DatePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (dateString: string) => void;
  initialDate?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ isVisible, onClose, onConfirm, initialDate }) => {
  const today = new Date();
  
  const init = useMemo(() => {
    if (initialDate) {
      const parts = initialDate.split('-');
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    const defaultDate = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
    return {
      year: String(defaultDate.getFullYear()),
      month: String(defaultDate.getMonth() + 1).padStart(2, '0'),
      day: String(defaultDate.getDate()).padStart(2, '0')
    };
  }, [initialDate]);

  const [selectedYear, setSelectedYear] = useState(init.year);
  const [selectedMonth, setSelectedMonth] = useState(init.month);
  const [selectedDay, setSelectedDay] = useState(init.day);

  const years = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 101 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), []);

  const days = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const lastDay = new Date(year, month, 0).getDate(); 
    return Array.from({ length: lastDay }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [selectedYear, selectedMonth]);

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    onConfirm(formattedDate);
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>생년월일 선택</Text>
            <Pressable onPress={handleConfirm}>
              <Text style={styles.modalConfirmText}>확인</Text>
            </Pressable>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={[styles.picker, { flex: 1.4 }]}
              itemStyle={styles.pickerItem}
            >
              {years.map(year => <Picker.Item key={year} label={`${year}년`} value={year} color="#fff" />)}
            </Picker>

            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={[styles.picker, { flex: 1 }]}
              itemStyle={styles.pickerItem}
            >
              {months.map(month => <Picker.Item key={month} label={`${month}월`} value={month} color="#fff" />)}
            </Picker>

            <Picker
              selectedValue={selectedDay}
              onValueChange={(itemValue) => setSelectedDay(itemValue)}
              style={[styles.picker, { flex: 1 }]}
              itemStyle={styles.pickerItem}
            >
              {days.map(day => <Picker.Item key={day} label={`${day}일`} value={day} color="#fff" />)}
            </Picker>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// =========================================================================
// ======================= 개인정보 수정 메인 화면 ===========================
// =========================================================================

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 서버에서 불러온 기존 데이터 보관용 (placeholder 용도)
  const [originalData, setOriginalData] = useState({
    email: '',
    nickname: '',
    birthDate: '',
    gender: ''
  });

  // 사용자가 새로 입력하는 상태 (비어있으면 기존 데이터 유지)
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState(''); 
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  
  // 피커 가시성 상태 관리
  const [isIOSPickerVisible, setIsIOSPickerVisible] = useState(false);
  const [isAndroidPickerVisible, setIsAndroidPickerVisible] = useState(false);

  // 화면 마운트 시 기존 사용자 정보 불러오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await getUserProfileApi();
        // ⚠️ API 응답 구조에 맞게 매핑해주세요. (ex: data.nickname, data.birth_date)
        setOriginalData({
          email: data.email || '이메일 정보 없음',
          nickname: data.nickname || '',
          birthDate: data.birth_date || '',
          gender: data.gender || ''
        });
      } catch (error) {
        console.error('유저 정보 로드 실패:', error);
        Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdate = async () => {
    // 변경된 값이 하나도 없으면 바로 뒤로가기
    if (!nickname && !birthDate && !gender) {
      router.back();
      return;
    }

    try {
      // 변경된 필드만 추려서 API로 전송 (state가 비어있으면 변경 안 한 것으로 간주)
      const updatePayload = {
        ...(nickname && { nickname }),
        ...(birthDate && { birth_date: birthDate }),
        ...(gender && { gender }),
      };

      await updateUserProfileApi(updatePayload);
      Alert.alert('성공', '개인정보가 수정되었습니다.');
      router.back(); 
    } catch (error: any) {
      console.error(error);
      Alert.alert('오류', '정보 수정에 실패했습니다.');
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setIsAndroidPickerVisible(true);
    } else {
      setIsIOSPickerVisible(true);
    }
  };

  const handleAndroidDateChange = (event: any, selectedDate?: Date) => {
    setIsAndroidPickerVisible(false);
    if (selectedDate && event.type !== 'dismissed') {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setBirthDate(`${year}-${month}-${day}`);
    }
  };

  const getAndroidInitialDate = () => {
    // 사용자가 방금 선택한 값이 있으면 그것을, 없으면 기존 서버 값을 캘린더 초기값으로 띄움
    const dateToUse = birthDate || originalData.birthDate;
    if (dateToUse) {
      const [y, m, d] = dateToUse.split('-');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const today = new Date();
    return new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
  };

  // 로딩 중 UI 처리
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF5A36" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>개인정보 수정</Text>
        
        {/* 이메일 (수정 불가 - 읽기 전용) */}
        <View style={styles.readOnlyContainer}>
          <Text style={styles.readOnlyLabel}>이메일</Text>
          <Text style={styles.readOnlyText}>{originalData.email}</Text>
        </View>

        {/* 닉네임 */}
        <TextInput
          style={styles.input}
          placeholder={originalData.nickname || '닉네임'}
          placeholderTextColor="#666" // 흐린 글씨
          value={nickname}
          onChangeText={setNickname}
        />

        {/* 생년월일 입력창 */}
        <Pressable onPress={openDatePicker}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              placeholder={originalData.birthDate || '생년월일 선택 (연-월-일)'}
              placeholderTextColor="#666" // 흐린 글씨
              value={birthDate}
              editable={false}
            />
          </View>
        </Pressable>

        {/* 성별 (입력값이 없으면 서버에서 받아온 기존 성별 렌더링) */}
        <View style={styles.genderContainer}>
          <Pressable 
            style={[
              styles.genderButton, 
              (gender || originalData.gender) === 'M' && styles.genderButtonActive
            ]} 
            onPress={() => setGender('M')}
          >
            <Text style={[
              styles.genderText, 
              (gender || originalData.gender) === 'M' && styles.genderTextActive
            ]}>남성</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.genderButton, 
              (gender || originalData.gender) === 'F' && styles.genderButtonActive
            ]} 
            onPress={() => setGender('F')}
          >
            <Text style={[
              styles.genderText, 
              (gender || originalData.gender) === 'F' && styles.genderTextActive
            ]}>여성</Text>
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>수정 완료</Text>
        </Pressable>
        
      </ScrollView>

      {/* 커스텀 데이트 피커 모달 (iOS) */}
      {Platform.OS === 'ios' && (
        <DatePickerModal 
          isVisible={isIOSPickerVisible}
          onClose={() => setIsIOSPickerVisible(false)}
          onConfirm={(dateString) => setBirthDate(dateString)}
          initialDate={birthDate || originalData.birthDate}
        />
      )}

      {/* 안드로이드 네이티브 피커 (Android) */}
      {Platform.OS === 'android' && isAndroidPickerVisible && (
        <DateTimePicker
          value={getAndroidInitialDate()}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={handleAndroidDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  
  readOnlyContainer: { marginBottom: 20, paddingHorizontal: 5 },
  readOnlyLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  readOnlyText: { color: '#ccc', fontSize: 16 },

  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderButton: { flex: 0.48, backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  genderButtonActive: { backgroundColor: 'rgba(255, 90, 54, 0.2)', borderColor: '#FF5A36' },
  genderText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  genderTextActive: { color: '#FF5A36' },

  button: { backgroundColor: '#FF5A36', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalConfirmText: { color: '#FF5A36', fontSize: 18, fontWeight: 'bold' },
  
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  picker: { flex: 1, height: Platform.OS === 'ios' ? 216 : 150, color: '#fff' },
  pickerItem: { fontSize: 20, color: '#fff' }, 
});