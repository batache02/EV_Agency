import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText, RadioButton } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import * as Yup from 'yup';
import { Formik } from 'formik';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  email: Yup.string()
    .email('البريد الإلكتروني غير صالح')
    .required('البريد الإلكتروني مطلوب'),
  password: Yup.string()
    .min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف')
    .required('كلمة المرور مطلوبة'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'كلمات المرور غير متطابقة')
    .required('تأكيد كلمة المرور مطلوب'),
  role: Yup.string().required('نوع المستخدم مطلوب'),
});

const RegisterScreen = ({ navigation }) => {
  const { register, error, loading } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

  const handleRegister = async (values) => {
    try {
      // حذف حقل تأكيد كلمة المرور قبل الإرسال
      const { confirmPassword, ...userData } = values;
      await register(userData);
      // بعد التسجيل بنجاح، انتقل إلى شاشة تسجيل الدخول
      navigation.navigate('Login');
    } catch (err) {
      console.error('خطأ في التسجيل:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>إنشاء حساب جديد</Text>

        <Formik
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'student',
          }}
          validationSchema={validationSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="الاسم الكامل"
                value={values.name}
                onChangeText={handleChange('name')}
                mode="outlined"
                style={styles.input}
                error={touched.name && errors.name}
              />
              {touched.name && errors.name && (
                <HelperText type="error">{errors.name}</HelperText>
              )}

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

              <TextInput
                label="تأكيد كلمة المرور"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                mode="outlined"
                style={styles.input}
                secureTextEntry={confirmSecureTextEntry}
                right={
                  <TextInput.Icon
                    icon={confirmSecureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                  />
                }
                error={touched.confirmPassword && errors.confirmPassword}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <HelperText type="error">{errors.confirmPassword}</HelperText>
              )}

              <Text style={styles.roleLabel}>نوع المستخدم:</Text>
              <RadioButton.Group
                onValueChange={(value) => setFieldValue('role', value)}
                value={values.role}
              >
                <View style={styles.radioContainer}>
                  <RadioButton.Item label="طالب" value="student" />
                  <RadioButton.Item label="مشرف" value="supervisor" />
                </View>
              </RadioButton.Group>
              {touched.role && errors.role && (
                <HelperText type="error">{errors.role}</HelperText>
              )}

              {error && <HelperText type="error">{error}</HelperText>}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                تسجيل
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>لديك حساب بالفعل؟</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>تسجيل الدخول</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
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
  roleLabel: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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

export default RegisterScreen;