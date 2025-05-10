import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Share } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, ActivityIndicator, List, Avatar, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getResearchById, reviewResearch } from '../../api/research';

const ResearchDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadResearch();
  }, [id]);

  const loadResearch = async () => {
    try {
      setLoading(true);
      const response = await getResearchById(id);
      setResearch(response.data);
    } catch (error) {
      console.error('Error loading research details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل البحث');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setReviewLoading(true);
      await reviewResearch(id, { status: reviewStatus });
      setReviewDialogVisible(false);
      Alert.alert('نجاح', 'تم تحديث حالة البحث بنجاح');
      loadResearch(); // إعادة تحميل البحث لعرض الحالة الجديدة
    } catch (error) {
      console.error('Error reviewing research:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة البحث');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${research.title}" - ${research.abstract}\n\nالكلمات المفتاحية: ${research.keywords.join(', ')}`,
        title: research.title,
      });
    } catch (error) {
      console.error('Error sharing research:', error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل البحث...</Text>
      </View>
    );
  }

  if (!research) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>لا يمكن تحميل تفاصيل البحث</Text>
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
            <Title style={styles.title}>{research.title}</Title>
            {renderStatusChip(research.status)}
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>تاريخ التقديم: {new Date(research.submissionDate).toLocaleDateString('ar-EG')}</Text>
            {research.reviewDate && (
              <Text style={styles.metaText}>تاريخ المراجعة: {new Date(research.reviewDate).toLocaleDateString('ar-EG')}</Text>
            )}
            {research.referenceNumber && (
              <Text style={styles.metaText}>الرقم المرجعي: {research.referenceNumber}</Text>
            )}
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>الملخص</Title>
          <Paragraph style={styles.abstract}>{research.abstract}</Paragraph>

          <Title style={styles.sectionTitle}>الكلمات المفتاحية</Title>
          <View style={styles.keywordsContainer}>
            {research.keywords.map((keyword, index) => (
              <Chip key={index} style={styles.keywordChip}>{keyword}</Chip>
            ))}
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>المؤلفون</Title>
          <List.Item
            title={research.author.name}
            description="المؤلف الرئيسي"
            left={props => <Avatar.Icon {...props} icon="account" />}
          />
          {research.coAuthors && research.coAuthors.length > 0 && (
            <>
              {research.coAuthors.map((coAuthor, index) => (
                <List.Item
                  key={index}
                  title={coAuthor.name}
                  description="مؤلف مشارك"
                  left={props => <Avatar.Icon {...props} icon="account-multiple" />}
                />
              ))}
            </>
          )}

          {research.supervisor && (
            <List.Item
              title={research.supervisor.name}
              description="المشرف"
              left={props => <Avatar.Icon {...props} icon="account-tie" />}
            />
          )}

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>الملفات المرفقة</Title>
          {research.files && research.files.length > 0 ? (
            research.files.map((file, index) => (
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

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>الملاحظات</Title>
          {research.notes && research.notes.length > 0 ? (
            research.notes.map((note, index) => (
              <Card key={index} style={styles.noteCard}>
                <Card.Content>
                  <Paragraph>{note.content}</Paragraph>
                  <Text style={styles.noteDate}>
                    {new Date(note.date).toLocaleDateString('ar-EG')} - {note.author.name}
                  </Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noContentText}>لا توجد ملاحظات</Text>
          )}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          {(user._id === research.author._id || user.role === 'admin' || user.role === 'supervisor') && (
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('ResearchEdit', { id: research._id })}
              disabled={research.status === 'approved'}
              style={styles.actionButton}
            >
              تعديل
            </Button>
          )}

          {(user.role === 'admin' || user.role === 'supervisor') && research.status === 'pending' && (
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
          <Dialog.Title>مراجعة البحث</Dialog.Title>
          <Dialog.Content>
            <Paragraph>الرجاء اختيار حالة البحث:</Paragraph>
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
  noteCard: {
    marginVertical: 5,
    backgroundColor: '#F5F5F5',
  },
  noteDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
    textAlign: 'left',
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

export default ResearchDetailScreen;