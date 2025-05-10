import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// تسجيل مستخدم جديد
export const register = async (userData) => {
  try {
    const response = await client.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'خطأ في الاتصال بالخادم' };
  }
};

// تسجيل الدخول
export const login = async (email, password) => {
  try {
    const response = await client.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    // تخزين رمز المصادقة وبيانات المستخدم
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error) {
    throw error.response ? error.response.data : { error: 'خطأ في الاتصال بالخادم' };
  }
};

// تسجيل الخروج
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return false;
  }
};

// الحصول على بيانات المستخدم الحالي
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('خطأ في الحصول على بيانات المستخدم:', error);
    return null;
  }
};

// تحديث بيانات المستخدم
export const updateProfile = async (userData) => {
  try {
    const response = await client.put('/auth/update-profile', userData);
    const updatedUser = response.data.data;
    
    // تحديث بيانات المستخدم المخزنة
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'خطأ في الاتصال بالخادم' };
  }
};

// تغيير كلمة المرور
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await client.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'خطأ في الاتصال بالخادم' };
  }
};