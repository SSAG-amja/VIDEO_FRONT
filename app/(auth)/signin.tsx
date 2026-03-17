import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signinApi } from '../../api/auth';

//260315 박현식
//회원가입
export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  const handleSignin = async () => {
    try {
      await signinApi(email, password, nickname);
      Alert.alert('성공', '가입되었습니다! 이제 로그인해주세요.');
      router.replace('/login'); // 회원가입 후 로그인으로 이동
    } catch (error: any) {
      console.error(error);
      Alert.alert('오류', '회원가입에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="닉네임"
        placeholderTextColor="#666"
        value={nickname}
        onChangeText={setNickname}
      />
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
        <Text style={styles.buttonText}>가입하기</Text>
      </Pressable>
      
      <Pressable onPress={() => router.back()}>
        <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
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