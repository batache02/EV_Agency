import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, FAB, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getTheses, getMyTheses, getSupervisorTheses, deleteThesis } from '../../api/thesis';

// حذف الدوال القديمة getTheses و deleteThesis

const ThesisListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTheses, setFilteredTheses] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  const loadTheses = async () => {
    try {
      setLoading(true);
      const response = await getTheses();
      setTheses(response.data);
      setFilteredTheses(response.data);
    } catch (error) {
      console.error('Error loading theses:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل قائمة المذكرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTheses();

    // إعادة تحميل البيانات عند العودة إلى هذه الشاشة
    const unsubscribe = navigation.addListener('focus', () => {
      loadTheses();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // تطبيق البحث والفلترة
    let result = theses;
    
    // تطبيق الفلترة حسب الحالة
    if (filter !== 'all') {
      result = result.filter(item => item.status === filter);
    }
    
    // تطبيق البحث
    if (searchQuery) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredTheses(result);
  }, [theses, searchQuery, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTheses();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذه المذكرة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteThesis(id);
              // تحديث القائمة بعد الحذف
              setTheses(theses.filter(item => item._id !== id));
              Alert.alert('نجاح', 'تم حذف المذكرة بنجاح');
            } catch (error) {
              console.error('Error deleting thesis:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المذكرة');
            }
          } 
        },
      ]
    );
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ThesisDetail', { id: item._id })}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle} numberOfLines={2}>{item.title}</Title>
            {renderStatusChip(item.status)}
          </View>
          
          <Paragraph style={styles.cardAbstract} numberOfLines={3}>{item.abstract}</Paragraph>
          
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>النوع: {renderThesisType(item.type)}</Text>
            <Text style={styles.cardMetaText}>الطالب: {item.student.name}</Text>
            {item.supervisor && (
              <Text style={styles.cardMetaText}>المشرف: {item.supervisor.name}</Text>
            )}
            <Text style={styles.cardMetaText}>
              تاريخ التقديم: {new Date(item.submissionDate).toLocaleDateString('ar-EG')}
            </Text>
          </View>
          
          <View style={styles.keywordsContainer}>
            {item.keywords.slice(0, 3).map((keyword, index) => (
              <Chip key={index} style={styles.keywordChip} textStyle={styles.keywordText}>
                {keyword}
              </Chip>
            ))}
            {item.keywords.length > 3 && (
              <Chip style={styles.keywordChip} textStyle={styles.keywordText}>
                +{item.keywords.length - 3}
              </Chip>
            )}
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            icon="eye" 
            mode="text" 
            onPress={() => navigation.navigate('ThesisDetail', { id: item._id })}
          >
            عرض
          </Button>
          
          {(user._id === item.student._id || user.role === 'admin' || user.role === 'supervisor') && (
            <Button 
              icon="pencil" 
              mode="text" 
              onPress={() => navigation.navigate('ThesisEdit', { id: item._id })}
              disabled={item.status === 'approved'}
            >
              تعديل
            </Button>
          )}
          
          {(user._id === item.student._id || user.role === 'admin') && (
            <Button 
              icon="delete" 
              mode="text" 
              onPress={() => handleDelete(item._id)}
              disabled={item.status === 'approved'}
              color="#F44336"
            >
              حذف
            </Button>
          )}
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="بحث في المذكرات..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            الكل
          </Chip>
          <Chip
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
          >
            قيد المراجعة
          </Chip>
          <Chip
            selected={filter === 'approved'}
            onPress={() => setFilter('approved')}
            style={styles.filterChip}
          >
            معتمد
          </Chip>
          <Chip
            selected={filter === 'rejected'}
            onPress={() => setFilter('rejected')}
            style={styles.filterChip}
          >
            مرفوض
          </Chip>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>جاري تحميل المذكرات...</Text>
        </View>
      ) : filteredTheses.length > 0 ? (
        <FlatList
          data={filteredTheses}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>
            {searchQuery || filter !== 'all' 
              ? 'لا توجد مذكرات تطابق معايير البحث'
              : 'لا توجد مذكرات متاحة'}
          </Text>
          <Button 
            mode="contained" 
            onPress={loadTheses}
            style={styles.retryButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('ThesisCreate')}
        label="مذكرة جديدة"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 10,
    elevation: 2,
  },
  filterContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  cardAbstract: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  cardMeta: {
    marginBottom: 8,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordChip: {
    margin: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
  },
  keywordText: {
    fontSize: 10,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default ThesisListScreen;