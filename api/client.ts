import { API_BASE_URL } from '@/constants/api';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 260318 박현식
// url 수정했어염
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default client;
