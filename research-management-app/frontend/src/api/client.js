import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.100:5000/api', // قم بتغيير هذا إلى عنوان IP الخاص بك
  headers: {
    'Content-Type': 'application/json'
  }
});

// إضافة اعتراض للطلبات لإضافة رمز المصادقة
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة اعتراض للاستجابات للتعامل مع أخطاء المصادقة
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // تسجيل الخروج عند انتهاء صلاحية الرمز
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // يمكنك إضافة توجيه إلى شاشة تسجيل الدخول هنا
    }
    return Promise.reject(error);
  }
);

export default apiClient;