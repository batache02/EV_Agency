import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Share } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, ActivityIndicator, List, Avatar, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getThesisById, reviewThesis } from '../../api/thesis';

const ThesisDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadThesis();
  }, [id]);

  const loadThesis = async () => {
    try {
      setLoading(true);
      const response = await getThesisById(id);
      setThesis(response.data);
    } catch (error) {
      console.error('Error loading thesis details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل المذكرة');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setReviewLoading(true);
      await reviewThesis(id, { status: reviewStatus });
      setReviewDialogVisible(false);
      Alert.alert('نجاح', 'تم تحديث حالة المذكرة بنجاح');
      loadThesis(); // إعادة تحميل المذكرة لعرض الحالة الجديدة
    } catch (error) {
      console.error('Error reviewing thesis:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة المذكرة');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${thesis.title}" - ${thesis.abstract}\n\nالكلمات المفتاحية: ${thesis.keywords.join(', ')}`,
        title: thesis.title,
      });
    } catch (error) {
      console.error('Error sharing thesis:', error);
    }
  };

  const openFile = (fileUrl) => {
    Linking.openURL(fileUrl).catch(err => {
      console.error('Error opening file:', err);
      Alert.alert('خطأ', 'لا يمكن فتح الملف');
    });
  };

  const renderStatusChip = (status) => {
    let color, icon, label;
    
    switch(status) {
      case 'pending':
        color = '#FFA000';
        icon = 'clock-outline';
        label = 'قيد المراجعة';
        break;
      case 'approved':
        color = '#4CAF50';
        icon = 'check-circle';
        label = 'معتمد';
        break;
      case 'rejected':
        color = '#F44336';
        icon = 'close-circle';
        label = 'مرفوض';
        break;
      default:
        color = '#9E9E9E';
        icon = 'help-circle';
        label = 'غير معروف';
    }
    
    return (
      <Chip 
        icon={icon} 
        style={[styles.statusChip, { backgroundColor: color + '20' }]}
        textStyle={{ color }}
      >
        {label}
      </Chip>
    );
  };

  const renderThesisType = (type) => {
    let label;
    
    switch(type) {
      case 'bachelor':
        label = 'بكالوريوس';
        break;
      case 'master':
        label = 'ماجستير';
        break;
      case 'phd':
        label = 'دكتوراه';
        break;
      default:
        label = 'غير محدد';
    }
    
    return label;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل المذكرة...</Text>
      </View>
    );
  }

  if (!thesis) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>لا يمكن تحميل تفاصيل المذكرة</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.errorButton}>
          العودة
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <Title style={styles.title}>{thesis.title}</Title>
            {renderStatusChip(thesis.status)}
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>نوع المذكرة: {renderThesisType(thesis.type)}</Text>
            <Text style={styles.metaText}>تاريخ التقديم: {new Date(thesis.submissionDate).toLocaleDateString('ar-EG')}</Text>
            {thesis.defenseInfo && thesis.defenseInfo.date && (
              <Text style={styles.metaText}>تاريخ المناقشة: {new Date(thesis.defenseInfo.date).toLocaleDateString('ar-EG')}</Text>
            )}
            {thesis.referenceNumber && (
              <Text style={styles.metaText}>الرقم المرجعي: {thesis.referenceNumber}</Text>
            )}
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>الملخص</Title>
          <Paragraph style={styles.abstract}>{thesis.abstract}</Paragraph>

          <Title style={styles.sectionTitle}>الكلمات المفتاحية</Title>
          <View style={styles.keywordsContainer}>
            {thesis.keywords.map((keyword, index) => (
              <Chip key={index} style={styles.keywordChip}>{keyword}</Chip>
            ))}
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>المؤلفون</Title>
          <List.Item
            title={thesis.student.name}
            description="الطالب"
            left={props => <Avatar.Icon {...props} icon="account" />}
          />
          {thesis.coStudents && thesis.coStudents.length > 0 && (
            <>
              {thesis.coStudents.map((coStudent, index) => (
                <List.Item
                  key={index}
                  title={coStudent.name}
                  description="طالب مشارك"
                  left={props => <Avatar.Icon {...props} icon="account-multiple" />}
                />
              ))}
            </>
          )}

          {thesis.supervisor && (
            <List.Item
              title={thesis.supervisor.name}
              description="المشرف"
              left={props => <Avatar.Icon {...props} icon="account-tie" />}
            />
          )}

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>الملفات المرفقة</Title>
          {thesis.files && thesis.files.length > 0 ? (
            thesis.files.map((file, index) => (
              <List.Item
                key={index}
                title={file.name || `ملف ${index + 1}`}
                description={file.type || 'مستند'}
                left={props => <List.Icon {...props} icon="file-document" />}
                right={() => (
                  <Button mode="text" onPress={() => openFile(file.url)}>
                    فتح
                  </Button>
                )}
              />
            ))
          ) : (
            <Text style={styles.noContentText}>لا توجد ملفات مرفقة</Text>
          )}

          {thesis.defenseInfo && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>معلومات المناقشة</Title>
              <Card style={styles.defenseCard}>
                <Card.Content>
                  {thesis.defenseInfo.date && (
                    <Text style={styles.defenseText}>التاريخ: {new Date(thesis.defenseInfo.date).toLocaleDateString('ar-EG')}</Text>
                  )}
                  {thesis.defenseInfo.location && (
                    <Text style={styles.defenseText}>المكان: {thesis.defenseInfo.location}</Text>
                  )}
                  {thesis.defenseInfo.committee && thesis.defenseInfo.committee.length > 0 && (
                    <>
                      <Text style={styles.defenseText}>لجنة المناقشة:</Text>
                      {thesis.defenseInfo.committee.map((member, index) => (
                        <Text key={index} style={styles.committeeMember}>- {member.name} ({member.role})</Text>
                      ))}
                    </>
                  )}
                  {thesis.defenseInfo.notes && (
                    <Text style={styles.defenseText}>ملاحظات: {thesis.defenseInfo.notes}</Text>
                  )}
                </Card.Content>
              </Card>
            </>
          )}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          {(user._id === thesis.student._id || user.role === 'admin' || user._id === thesis.supervisor._id) && (
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('ThesisEdit', { id: thesis._id })}
              disabled={thesis.status === 'approved'}
              style={styles.actionButton}
            >
              تعديل
            </Button>
          )}

          {(user.role === 'admin' || user._id === thesis.supervisor._id) && thesis.status === 'pending' && (
            <Button 
              mode="contained" 
              onPress={() => setReviewDialogVisible(true)}
              style={[styles.actionButton, styles.reviewButton]}
            >
              مراجعة
            </Button>
          )}

          <Button 
            mode="outlined" 
            onPress={handleShare}
            icon="share-variant"
            style={styles.actionButton}
          >
            مشاركة
          </Button>
        </Card.Actions>
      </Card>

      <Portal>
        <Dialog visible={reviewDialogVisible} onDismiss={() => setReviewDialogVisible(false)}>
          <Dialog.Title>مراجعة المذكرة</Dialog.Title>
          <Dialog.Content>
            <Paragraph>الرجاء اختيار حالة المذكرة:</Paragraph>
            <View style={styles.reviewOptions}>
              <Button 
                mode={reviewStatus === 'approved' ? 'contained' : 'outlined'}
                onPress={() => setReviewStatus('approved')}
                style={[styles.reviewOption, reviewStatus === 'approved' && styles.approvedButton]}
              >
                موافقة
              </Button>
              <Button 
                mode={reviewStatus === 'rejected' ? 'contained' : 'outlined'}
                onPress={() => setReviewStatus('rejected')}
                style={[styles.reviewOption, reviewStatus === 'rejected' && styles.rejectedButton]}
              >
                رفض
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReviewDialogVisible(false)}>إلغاء</Button>
            <Button 
              onPress={handleReview} 
              disabled={!reviewStatus || reviewLoading}
              loading={reviewLoading}
            >
              تأكيد
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusChip: {
    marginLeft: 8,
  },
  metaContainer: {
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  abstract: {
    textAlign: 'justify',
    marginBottom: 15,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  keywordChip: {
    margin: 2,
    backgroundColor: '#E0E0E0',
  },
  defenseCard: {
    marginVertical: 5,
    backgroundColor: '#F5F5F5',
  },
  defenseText: {
    marginBottom: 5,
  },
  committeeMember: {
    marginLeft: 10,
    marginBottom: 3,
    fontSize: 14,
  },
  noContentText: {
    fontStyle: 'italic',
    color: '#9E9E9E',
    marginVertical: 10,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    marginLeft: 8,
  },
  reviewButton: {
    backgroundColor: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 10,
  },
  reviewOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  reviewOption: {
    flex: 1,
    marginHorizontal: 5,
  },
  approvedButton: {
    backgroundColor: '#4CAF50',
  },
  rejectedButton: {
    backgroundColor: '#F44336',
  },
});

export default ThesisDetailScreen;