import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { updateUserPasswordApi } from '../api/user';

export default function EditPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2026.05.13 박현식
  // 현재 비밀번호 인증 이후 새 비밀번호와 확인값을 검증해 백엔드 변경 API로 전달한다.
  const handleUpdatePassword = async () => {
    if (!newPassword || !newPasswordConfirm) {
      Alert.alert('알림', '새 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (newPassword.length < 8 || newPasswordConfirm.length < 8) {
      Alert.alert('알림', '비밀번호는 8자리 이상이어야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      Alert.alert('알림', '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserPasswordApi({
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      Alert.alert('성공', '비밀번호가 변경되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Password Update Error:', error);
      const message = error?.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
      Alert.alert('오류', typeof message === 'string' ? message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.container}>
        <Text style={styles.title}>비밀번호 수정</Text>
        <Text style={styles.description}>새 비밀번호는 8자리 이상으로 입력해주세요.</Text>

        <TextInput
          style={styles.input}
          placeholder="새 비밀번호"
          placeholderTextColor="#666"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="새 비밀번호 확인"
          placeholderTextColor="#666"
          value={newPasswordConfirm}
          onChangeText={setNewPasswordConfirm}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleUpdatePassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>비밀번호 변경</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
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
  button: {
    backgroundColor: '#FF5A36',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
