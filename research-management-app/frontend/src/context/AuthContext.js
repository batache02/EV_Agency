import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // التحقق من حالة المصادقة عند بدء التطبيق
    const loadUser = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('خطأ في تحميل بيانات المستخدم:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await authApi.login(email, password);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.error || 'فشل تسجيل الدخول');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // تسجيل مستخدم جديد
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authApi.register(userData);
      return result;
    } catch (err) {
      setError(err.error || 'فشل التسجيل');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
    } catch (err) {
      console.error('خطأ في تسجيل الخروج:', err);
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المستخدم
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await authApi.updateProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.error || 'فشل تحديث الملف الشخصي');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// هوك مخصص لاستخدام سياق المصادقة
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return context;
};