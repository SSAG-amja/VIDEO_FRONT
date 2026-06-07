import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import KeyboardAccessory, {
  KEYBOARD_ACCESSORY_ID,
} from '../../components/KeyboardAccessory';
import {
  sendPasswordResetCodeApi,
  verifyPasswordResetCodeApi,
  confirmPasswordResetApi,
} from '../../api/auth';

type ResetStep = 'email' | 'code' | 'password';

export default function PasswordResetScreen() {
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordCheck, setNewPasswordCheck] = useState('');

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const isEmailError =
    email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPasswordError = newPassword !== '' && newPassword.length < 8;

  const isPasswordCheckError =
    newPasswordCheck !== '' && newPassword !== newPasswordCheck;

  const getErrorMessage = (error: any, fallbackMessage: string) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    const message = error?.response?.data?.message;

    if (status === 429) {
      return typeof detail === 'string'
        ? detail
        : '인증 코드 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.';
    }

    if (status === 422) {
      if (Array.isArray(detail)) {
        return detail
          .map((item: any) => item?.msg)
          .filter(Boolean)
          .join('\n');
      }

      return '요청 형식이 올바르지 않습니다. 입력값을 다시 확인해주세요.';
    }

    return detail || message || fallbackMessage;
  };

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (isEmailError) {
      Alert.alert('오류', '이메일 형식을 다시 확인해주세요.');
      return;
    }

    try {
      setIsSendingCode(true);

      await sendPasswordResetCodeApi(email);

      Alert.alert('성공', '인증 코드가 이메일로 발송되었습니다.');
      setStep('code');
    } catch (error: any) {
      console.error('status:', error?.response?.status);
      console.error('data:', JSON.stringify(error?.response?.data, null, 2));

      Alert.alert(
        '오류',
        getErrorMessage(error, '인증 코드 발송에 실패했습니다.')
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert('알림', '인증 코드를 입력해주세요.');
      return;
    }

    try {
      setIsVerifyingCode(true);

      const result = await verifyPasswordResetCodeApi(email, code);

      setResetToken(result.reset_token);
      Alert.alert('성공', '이메일 인증이 완료되었습니다.');
      setStep('password');
    } catch (error: any) {
      console.error('status:', error?.response?.status);
      console.error('data:', JSON.stringify(error?.response?.data, null, 2));

      Alert.alert(
        '오류',
        getErrorMessage(error, '인증 코드 확인에 실패했습니다.')
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !newPasswordCheck) {
      Alert.alert('알림', '새 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (isPasswordError || isPasswordCheckError) {
      Alert.alert('오류', '비밀번호 입력값을 다시 확인해주세요.');
      return;
    }

    if (!resetToken) {
      Alert.alert('오류', '비밀번호 재설정 인증 정보가 없습니다.');
      setStep('email');
      return;
    }

    try {
      setIsResettingPassword(true);

      await confirmPasswordResetApi(
        email,
        resetToken,
        newPassword,
        newPasswordCheck
      );

      Alert.alert('성공', '비밀번호가 재설정되었습니다. 다시 로그인해주세요.');
      router.replace('/signin');
    } catch (error: any) {
      console.error('status:', error?.response?.status);
      console.error('data:', JSON.stringify(error?.response?.data, null, 2));

      Alert.alert(
        '오류',
        getErrorMessage(error, '비밀번호 재설정에 실패했습니다.')
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGoBackStep = () => {
    if (step === 'password') {
      setStep('code');
      return;
    }

    if (step === 'code') {
      setStep('email');
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={handleGoBackStep} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ 뒤로</Text>
        </Pressable>

        <Text style={styles.title}>비밀번호 재설정</Text>

        <Text style={styles.description}>
          가입한 이메일로 인증 코드를 받은 뒤 새 비밀번호를 설정할 수 있습니다.
        </Text>

        {step === 'email' && (
          <>
            <Text style={styles.label}>이메일</Text>

            <TextInput
              style={[styles.input, isEmailError && styles.inputError]}
              placeholder="가입한 이메일 입력"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              editable={!isSendingCode}
            />

            {isEmailError && (
              <Text style={styles.errorText}>
                이메일 형식에 맞춰 입력해주세요.
              </Text>
            )}

            <Pressable
              style={[
                styles.button,
                (!email || isEmailError || isSendingCode) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={!email || isEmailError || isSendingCode}
            >
              {isSendingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>인증 코드 발송</Text>
              )}
            </Pressable>
          </>
        )}

        {step === 'code' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                {email} 주소로 발송된 인증 코드를 입력해주세요.
              </Text>
            </View>

            <Text style={styles.label}>인증 코드</Text>

            <TextInput
              style={styles.input}
              placeholder="인증 코드 입력"
              placeholderTextColor="#666"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              editable={!isVerifyingCode}
            />

            <Pressable
              style={[
                styles.button,
                (!code || isVerifyingCode) && styles.buttonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={!code || isVerifyingCode}
            >
              {isVerifyingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>인증 코드 확인</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.subButton}
              onPress={handleSendCode}
              disabled={isSendingCode}
            >
              <Text style={styles.subButtonText}>
                {isSendingCode ? '재발송 중...' : '인증 코드 재발송'}
              </Text>
            </Pressable>
          </>
        )}

        {step === 'password' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.
              </Text>
            </View>

            <Text style={styles.label}>새 비밀번호</Text>

            <TextInput
              style={[styles.input, isPasswordError && styles.inputError]}
              placeholder="새 비밀번호 (8자 이상)"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              editable={!isResettingPassword}
            />

            {isPasswordError && (
              <Text style={styles.errorText}>
                비밀번호는 8자 이상이어야 합니다.
              </Text>
            )}

            <Text style={styles.label}>새 비밀번호 확인</Text>

            <TextInput
              style={[styles.input, isPasswordCheckError && styles.inputError]}
              placeholder="새 비밀번호 확인"
              placeholderTextColor="#666"
              value={newPasswordCheck}
              onChangeText={setNewPasswordCheck}
              secureTextEntry
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              editable={!isResettingPassword}
            />

            {isPasswordCheckError && (
              <Text style={styles.errorText}>
                비밀번호가 일치하지 않습니다.
              </Text>
            )}

            <Pressable
              style={[
                styles.button,
                (!newPassword ||
                  !newPasswordCheck ||
                  isPasswordError ||
                  isPasswordCheckError ||
                  isResettingPassword) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={
                !newPassword ||
                !newPasswordCheck ||
                isPasswordError ||
                isPasswordCheckError ||
                isResettingPassword
              }
            >
              {isResettingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>비밀번호 재설정</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => router.replace('/signin')}
          style={styles.loginLinkContainer}
        >
          <Text style={styles.loginLinkText}>로그인 화면으로 돌아가기</Text>
        </Pressable>
      </ScrollView>

      <KeyboardAccessory />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingRight: 12,
  },

  backButtonText: {
    color: '#aaa',
    fontSize: 16,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  description: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 30,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },

  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },

  inputError: {
    borderColor: '#FF3B30',
    marginBottom: 5,
  },

  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
  },

  noticeBox: {
    backgroundColor: 'rgba(255, 90, 54, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 54, 0.35)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },

  noticeText: {
    color: '#FFB39F',
    fontSize: 13,
    lineHeight: 19,
  },

  button: {
    backgroundColor: '#FF5A36',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  buttonDisabled: {
    backgroundColor: '#555',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  subButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  subButtonText: {
    color: '#FF5A36',
    fontSize: 14,
    fontWeight: '600',
  },

  loginLinkContainer: {
    marginTop: 24,
    padding: 10,
  },

  loginLinkText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
  },
});