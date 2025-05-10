import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import * as Yup from 'yup';
import { Formik } from 'formik';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('البريد الإلكتروني غير صالح')
    .required('البريد الإلكتروني مطلوب'),
  password: Yup.string()
    .min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف')
    .required('كلمة المرور مطلوبة'),
});

const LoginScreen = ({ navigation }) => {
  const { login, error, loading } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleLogin = async (values) => {
    try {
      await login(values.email, values.password);
      // سيتم التوجيه تلقائيًا من خلال AuthContext
    } catch (err) {
      console.error('خطأ في تسجيل الدخول:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>نظام إدارة البحوث العلمية</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="البريد الإلكتروني"
                value={values.email}
                onChangeText={handleChange('email')}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email && errors.email}
              />
              {touched.email && errors.email && (
                <HelperText type="error">{errors.email}</HelperText>
              )}

              <TextInput
                label="كلمة المرور"
                value={values.password}
                onChangeText={handleChange('password')}
                mode="outlined"
                style={styles.input}
                secureTextEntry={secureTextEntry}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
                error={touched.password && errors.password}
              />
              {touched.password && errors.password && (
                <HelperText type="error">{errors.password}</HelperText>
              )}

              {error && <HelperText type="error">{error}</HelperText>}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                تسجيل الدخول
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>ليس لديك حساب؟</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>إنشاء حساب جديد</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
    color: '#666',
  },
  footerLink: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default LoginScreen;