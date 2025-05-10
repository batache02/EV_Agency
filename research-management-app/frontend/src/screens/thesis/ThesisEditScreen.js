import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Chip, Divider, HelperText, ActivityIndicator } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { getThesisById, updateThesis } from '../../api/thesis';
import DocumentPicker from 'react-native-document-picker';

const validationSchema = Yup.object().shape({
  title: Yup.string().required('عنوان المذكرة مطلوب'),
  abstract: Yup.string().required('ملخص المذكرة مطلوب'),
  type: Yup.string().required('نوع المذكرة مطلوب').oneOf(['bachelor', 'master', 'phd'], 'نوع المذكرة غير صالح'),
  keywords: Yup.array().min(1, 'يجب إضافة كلمة مفتاحية واحدة على الأقل'),
});

const ThesisEditScreen = ({ route, navigation }) => {
  const { thesisId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thesis, setThesis] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadThesis();
  }, [thesisId]);

  const loadThesis = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const response = await getThesisById(thesisId);
      setThesis(response.data);
      
      // تعيين الملفات الموجودة
      if (response.data.files && response.data.files.length > 0) {
        setExistingFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error loading thesis:', error);
      setError('حدث خطأ أثناء تحميل بيانات المذكرة');
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleRemoveExistingFile = (fileId) => {
    setExistingFiles(existingFiles.filter(file => file._id !== fileId));
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
      
      // إضافة الملفات الجديدة إلى FormData
      selectedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });
      
      // إضافة قائمة الملفات الموجودة التي لم يتم حذفها
      existingFiles.forEach(file => {
        formData.append('existingFiles[]', file._id);
      });
      
      await updateThesis(thesisId, formData);
      Alert.alert('نجاح', 'تم تحديث المذكرة بنجاح');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating thesis:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المذكرة');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Title>جاري تحميل بيانات المذكرة...</Title>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Title style={styles.errorText}>{error}</Title>
        <Button mode="contained" onPress={loadThesis}>إعادة المحاولة</Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>العودة</Button>
      </View>
    );
  }

  if (!thesis) {
    return (
      <View style={styles.errorContainer}>
        <Title style={styles.errorText}>لم يتم العثور على المذكرة</Title>
        <Button mode="outlined" onPress={() => navigation.goBack()}>العودة</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Formik
        initialValues={{
          title: thesis.title || '',
          abstract: thesis.abstract || '',
          type: thesis.type || 'bachelor',
          keywords: thesis.keywords || [],
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.formContainer}>
            <Title style={styles.title}>تعديل المذكرة</Title>
            
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
            
            <Title style={styles.sectionTitle}>الملفات الموجودة</Title>
            {existingFiles.length > 0 ? (
              <View style={styles.filesContainer}>
                {existingFiles.map((file) => (
                  <Chip
                    key={file._id}
                    onClose={() => handleRemoveExistingFile(file._id)}
                    style={styles.fileChip}
                    icon="file-document"
                  >
                    {file.originalname || file.filename}
                  </Chip>
                ))}
              </View>
            ) : (
              <Title style={styles.noFilesText}>لا توجد ملفات مرفقة</Title>
            )}
            
            <Title style={styles.sectionTitle}>إضافة ملفات جديدة</Title>
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
                حفظ التغييرات
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
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
  noFilesText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#757575',
    marginBottom: 16,
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

export default ThesisEditScreen;