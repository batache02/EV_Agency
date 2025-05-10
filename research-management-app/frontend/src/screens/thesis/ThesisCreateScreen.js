import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Chip, Divider, HelperText, ActivityIndicator } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { createThesis } from '../../api/thesis';
import DocumentPicker from 'react-native-document-picker';

const validationSchema = Yup.object().shape({
  title: Yup.string().required('عنوان المذكرة مطلوب'),
  abstract: Yup.string().required('ملخص المذكرة مطلوب'),
  type: Yup.string().required('نوع المذكرة مطلوب').oneOf(['bachelor', 'master', 'phd'], 'نوع المذكرة غير صالح'),
  keywords: Yup.array().min(1, 'يجب إضافة كلمة مفتاحية واحدة على الأقل'),
});

const ThesisCreateScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [keyword, setKeyword] = useState('');

  const handlePickDocuments = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      setSelectedFiles([...selectedFiles, ...results]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // المستخدم ألغى اختيار الملفات
      } else {
        console.error('خطأ في اختيار الملفات:', err);
        Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الملفات');
      }
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleAddKeyword = (values, setFieldValue) => {
    if (keyword.trim() && !values.keywords.includes(keyword.trim())) {
      setFieldValue('keywords', [...values.keywords, keyword.trim()]);
      setKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword, values, setFieldValue) => {
    setFieldValue('keywords', values.keywords.filter(k => k !== keyword));
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // إنشاء FormData لإرسال الملفات
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('abstract', values.abstract);
      formData.append('type', values.type);
      values.keywords.forEach(keyword => {
        formData.append('keywords[]', keyword);
      });
      
      // إضافة الملفات إلى FormData
      selectedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });
      
      await createThesis(formData);
      Alert.alert('نجاح', 'تم إنشاء المذكرة بنجاح');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating thesis:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء المذكرة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Formik
        initialValues={{
          title: '',
          abstract: '',
          type: 'bachelor',
          keywords: [],
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.formContainer}>
            <Title style={styles.title}>إنشاء مذكرة جديدة</Title>
            
            <TextInput
              label="عنوان المذكرة"
              value={values.title}
              onChangeText={handleChange('title')}
              onBlur={handleBlur('title')}
              style={styles.input}
              error={touched.title && errors.title}
            />
            {touched.title && errors.title && (
              <HelperText type="error">{errors.title}</HelperText>
            )}
            
            <TextInput
              label="ملخص المذكرة"
              value={values.abstract}
              onChangeText={handleChange('abstract')}
              onBlur={handleBlur('abstract')}
              style={styles.input}
              multiline
              numberOfLines={4}
              error={touched.abstract && errors.abstract}
            />
            {touched.abstract && errors.abstract && (
              <HelperText type="error">{errors.abstract}</HelperText>
            )}
            
            <Title style={styles.sectionTitle}>نوع المذكرة</Title>
            <View style={styles.typeContainer}>
              <Chip
                selected={values.type === 'bachelor'}
                onPress={() => setFieldValue('type', 'bachelor')}
                style={styles.typeChip}
              >
                بكالوريوس
              </Chip>
              <Chip
                selected={values.type === 'master'}
                onPress={() => setFieldValue('type', 'master')}
                style={styles.typeChip}
              >
                ماجستير
              </Chip>
              <Chip
                selected={values.type === 'phd'}
                onPress={() => setFieldValue('type', 'phd')}
                style={styles.typeChip}
              >
                دكتوراه
              </Chip>
            </View>
            {touched.type && errors.type && (
              <HelperText type="error">{errors.type}</HelperText>
            )}
            
            <Divider style={styles.divider} />
            
            <Title style={styles.sectionTitle}>الكلمات المفتاحية</Title>
            <View style={styles.keywordInputContainer}>
              <TextInput
                label="كلمة مفتاحية"
                value={keyword}
                onChangeText={setKeyword}
                style={styles.keywordInput}
              />
              <Button
                mode="contained"
                onPress={() => handleAddKeyword(values, setFieldValue)}
                style={styles.addButton}
              >
                إضافة
              </Button>
            </View>
            <View style={styles.keywordsContainer}>
              {values.keywords.map((kw, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveKeyword(kw, values, setFieldValue)}
                  style={styles.keywordChip}
                >
                  {kw}
                </Chip>
              ))}
            </View>
            {touched.keywords && errors.keywords && (
              <HelperText type="error">{errors.keywords}</HelperText>
            )}
            
            <Divider style={styles.divider} />
            
            <Title style={styles.sectionTitle}>الملفات المرفقة</Title>
            <Button
              mode="outlined"
              icon="file-upload"
              onPress={handlePickDocuments}
              style={styles.uploadButton}
            >
              اختيار ملفات
            </Button>
            <View style={styles.filesContainer}>
              {selectedFiles.map((file, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveFile(index)}
                  style={styles.fileChip}
                  icon="file-document"
                >
                  {file.name}
                </Chip>
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={loading}
                loading={loading}
              >
                إنشاء المذكرة
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
              >
                إلغاء
              </Button>
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeChip: {
    margin: 4,
  },
  divider: {
    marginVertical: 16,
  },
  keywordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  keywordInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 8,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  keywordChip: {
    margin: 4,
  },
  uploadButton: {
    marginBottom: 8,
  },
  filesContainer: {
    marginBottom: 16,
  },
  fileChip: {
    margin: 4,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ThesisCreateScreen;