import { API_BASE_URL } from '@/constants/api';
import axios from 'axios';

// 260318 박현식
// url 수정했어염
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;