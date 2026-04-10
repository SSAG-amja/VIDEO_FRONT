import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signinApi } from '../../api/auth';
import * as SecureStore from 'expo-secure-store';

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignin = async () => {
    try {
      const data = await signinApi(email, password);
      
      if (data && data.access_token) {
        await SecureStore.setItemAsync('userToken', data.access_token);
      }

      Alert.alert('성공', '로그인 되었습니다.');
      
      // 온보딩 완료 여부에 따라 화면 이동 분기
      if (data.is_onboarding_completed) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('오류', '이메일 또는 비밀번호를 확인하세요.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={handleSignin}>
        <Text style={styles.buttonText}>로그인</Text>
      </Pressable>
      
      {/* 회원가입 페이지로 이동 */}
      <Pressable onPress={() => router.push('/signup')}>
        <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#FF5A36', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#aaa', textAlign: 'center', marginTop: 20, fontSize: 14 },
});