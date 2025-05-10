import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, FAB, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getResearches, deleteResearch } from '../../api/research';

const ResearchListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResearches, setFilteredResearches] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  const loadResearches = async () => {
    try {
      setLoading(true);
      const response = await getResearches();
      setResearches(response.data);
      setFilteredResearches(response.data);
    } catch (error) {
      console.error('Error loading researches:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل قائمة الأبحاث');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResearches();

    // إعادة تحميل البيانات عند العودة إلى هذه الشاشة
    const unsubscribe = navigation.addListener('focus', () => {
      loadResearches();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // تطبيق البحث والفلترة
    let result = researches;
    
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
    
    setFilteredResearches(result);
  }, [researches, searchQuery, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResearches();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذا البحث؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteResearch(id);
              // تحديث القائمة بعد الحذف
              setResearches(researches.filter(item => item._id !== id));
              Alert.alert('نجاح', 'تم حذف البحث بنجاح');
            } catch (error) {
              console.error('Error deleting research:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف البحث');
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

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.cardTitle} numberOfLines={2}>{item.title}</Title>
          {renderStatusChip(item.status)}
        </View>
        
        <Paragraph numberOfLines={3}>{item.abstract}</Paragraph>
        
        <View style={styles.keywordsContainer}>
          {item.keywords.map((keyword, index) => (
            <Chip key={index} style={styles.keywordChip} small>{keyword}</Chip>
          ))}
        </View>
        
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>تاريخ التقديم: {new Date(item.submissionDate).toLocaleDateString('ar-EG')}</Text>
          {item.referenceNumber && (
            <Text style={styles.metaText}>الرقم المرجعي: {item.referenceNumber}</Text>
          )}
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('ResearchDetail', { id: item._id })}
        >
          عرض التفاصيل
        </Button>
        
        {(user._id === item.author || user.role === 'admin' || user.role === 'supervisor') && (
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('ResearchEdit', { id: item._id })}
            disabled={item.status === 'approved'}
          >
            تعديل
          </Button>
        )}
        
        {(user._id === item.author || user.role === 'admin') && (
          <Button 
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
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="بحث في العنوان، الملخص، الكلمات المفتاحية"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>تصفية حسب الحالة:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity onPress={() => setFilter('all')}>
            <Chip 
              selected={filter === 'all'} 
              style={styles.filterChip}
              selectedColor="#2196F3"
            >
              الكل
            </Chip>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setFilter('pending')}>
            <Chip 
              selected={filter === 'pending'} 
              style={styles.filterChip}
              selectedColor="#FFA000"
            >
              قيد المراجعة
            </Chip>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setFilter('approved')}>
            <Chip 
              selected={filter === 'approved'} 
              style={styles.filterChip}
              selectedColor="#4CAF50"
            >
              معتمد
            </Chip>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setFilter('rejected')}>
            <Chip 
              selected={filter === 'rejected'} 
              style={styles.filterChip}
              selectedColor="#F44336"
            >
              مرفوض
            </Chip>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>جاري تحميل الأبحاث...</Text>
        </View>
      ) : filteredResearches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color="#9E9E9E" />
          <Text style={styles.emptyText}>لا توجد أبحاث متاحة</Text>
          <Text style={styles.emptySubText}>
            {searchQuery || filter !== 'all' 
              ? 'حاول تغيير معايير البحث أو التصفية' 
              : 'قم بإنشاء بحث جديد للبدء'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredResearches}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="بحث جديد"
        onPress={() => navigation.navigate('ResearchCreate')}
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
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterLabel: {
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#555',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 80, // للتأكد من عدم تداخل FAB مع العناصر
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
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  keywordChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#E0E0E0',
  },
  metaContainer: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#757575',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default ResearchListScreen;