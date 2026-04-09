import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { signupApi } from '../../api/auth';
import { Picker } from '@react-native-picker/picker';
// 🟢 안드로이드 네이티브 피커를 위한 라이브러리 추가
import DateTimePicker from '@react-native-community/datetimepicker';

// --- 커스텀 데이트 피커 모달 컴포넌트 (iOS용 디자인 통일) ---
interface DatePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (dateString: string) => void;
  initialDate?: string; // YYYY-MM-DD
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
// ========================= 메인 회원가입 화면 =============================
// =========================================================================

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState(''); 
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  
  // 피커 가시성 상태 관리
  const [isIOSPickerVisible, setIsIOSPickerVisible] = useState(false);
  const [isAndroidPickerVisible, setIsAndroidPickerVisible] = useState(false);

  const router = useRouter();

  const isEmailError = email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordError = password !== '' && password.length < 8;
  const isPasswordCheckError = passwordCheck !== '' && password !== passwordCheck;

  const handleSignup = async () => {
    if (!email || !password || !passwordCheck || !nickname || !birthDate || !gender) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    if (isEmailError || isPasswordError || isPasswordCheckError) {
      Alert.alert('오류', '입력 양식을 다시 확인해주세요.');
      return;
    }

    try {
      await signupApi(email, password, passwordCheck, nickname, birthDate, gender);
      Alert.alert('성공', '가입되었습니다! 이제 로그인해주세요.');
      router.replace('/(auth)/signin'); 
    } catch (error: any) {
      console.error(error);
      Alert.alert('오류', '회원가입에 실패했습니다.');
    }
  };

  // 🟢 생년월일 클릭 시 운영체제 분기 처리
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setIsAndroidPickerVisible(true);
    } else {
      setIsIOSPickerVisible(true);
    }
  };

  // 🟢 안드로이드 데이트 피커 체인지 핸들러
  const handleAndroidDateChange = (event: any, selectedDate?: Date) => {
    setIsAndroidPickerVisible(false); // 선택 후 바로 닫기
    if (selectedDate && event.type !== 'dismissed') {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setBirthDate(`${year}-${month}-${day}`);
    }
  };

  // 안드로이드 피커 초기값 설정 헬퍼
  const getAndroidInitialDate = () => {
    if (birthDate) {
      const [y, m, d] = birthDate.split('-');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const today = new Date();
    return new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>회원가입</Text>
        
        {/* 이메일 */}
        <TextInput
          style={[styles.input, isEmailError && styles.inputError]}
          placeholder="이메일"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {isEmailError && <Text style={styles.errorText}>이메일 양식에 맞춰야 합니다.</Text>}
        
        {/* 비밀번호 */}
        <TextInput
          style={[styles.input, isPasswordError && styles.inputError]}
          placeholder="비밀번호 (8자 이상)"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {isPasswordError && <Text style={styles.errorText}>비밀번호는 8자 이상이어야 합니다.</Text>}

        {/* 비밀번호 확인 */}
        <TextInput
          style={[styles.input, isPasswordCheckError && styles.inputError]}
          placeholder="비밀번호 확인"
          placeholderTextColor="#666"
          value={passwordCheck}
          onChangeText={setPasswordCheck}
          secureTextEntry
        />
        {isPasswordCheckError && <Text style={styles.errorText}>비밀번호가 다릅니다.</Text>}

        {/* 닉네임 */}
        <TextInput
          style={styles.input}
          placeholder="닉네임"
          placeholderTextColor="#666"
          value={nickname}
          onChangeText={setNickname}
        />

        {/* 🟢 생년월일 입력창 */}
        <Pressable onPress={openDatePicker}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              placeholder="생년월일 선택 (연-월-일)"
              placeholderTextColor="#666"
              value={birthDate}
              editable={false}
            />
          </View>
        </Pressable>

        {/* 성별 */}
        <View style={styles.genderContainer}>
          <Pressable 
            style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]} 
            onPress={() => setGender('M')}
          >
            <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>남성</Text>
          </Pressable>
          <Pressable 
            style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]} 
            onPress={() => setGender('F')}
          >
            <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>여성</Text>
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>가입하기</Text>
        </Pressable>
        
        <Pressable onPress={() => router.push('/(auth)/signin')} style={styles.linkContainer}>
          <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
        </Pressable>
      </ScrollView>

      {/* 🟢 커스텀 데이트 피커 모달 (iOS 전용) */}
      {Platform.OS === 'ios' && (
        <DatePickerModal 
          isVisible={isIOSPickerVisible}
          onClose={() => setIsIOSPickerVisible(false)}
          onConfirm={(dateString) => setBirthDate(dateString)}
          initialDate={birthDate}
        />
      )}

      {/* 🟢 안드로이드 네이티브 피커 (Android 전용) */}
      {Platform.OS === 'android' && isAndroidPickerVisible && (
        <DateTimePicker
          value={getAndroidInitialDate()}
          mode="date"
          display="spinner" // 'calendar'로 변경하면 달력 UI로 나옵니다.
          maximumDate={new Date()} // 오늘 이후 날짜 선택 방지
          onChange={handleAndroidDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  inputError: { borderColor: '#FF3B30', marginBottom: 5 },
  errorText: { color: '#FF3B30', fontSize: 12, marginBottom: 15, marginLeft: 5 },
  
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderButton: { flex: 0.48, backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  genderButtonActive: { backgroundColor: 'rgba(255, 90, 54, 0.2)', borderColor: '#FF5A36' },
  genderText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  genderTextActive: { color: '#FF5A36' },

  button: { backgroundColor: '#FF5A36', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  linkContainer: { marginTop: 20, padding: 10 },
  linkText: { color: '#aaa', textAlign: 'center', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalConfirmText: { color: '#FF5A36', fontSize: 18, fontWeight: 'bold' },
  
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  picker: { flex: 1, height: Platform.OS === 'ios' ? 216 : 150, color: '#fff' },
  pickerItem: { fontSize: 20, color: '#fff' }, 
});