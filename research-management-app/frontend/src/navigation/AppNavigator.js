import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

// شاشات المصادقة
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// سيتم إضافة شاشات أخرى لاحقًا
// import HomeScreen from '../screens/HomeScreen';
// import ResearchListScreen from '../screens/research/ResearchListScreen';
// import ResearchDetailScreen from '../screens/research/ResearchDetailScreen';
// import ThesisListScreen from '../screens/thesis/ThesisListScreen';
// import ThesisDetailScreen from '../screens/thesis/ThesisDetailScreen';
// import ProfileScreen from '../screens/profile/ProfileScreen';
// import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// مكون مؤقت للشاشات التي لم يتم إنشاؤها بعد
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>شاشة {route.name} (قيد التطوير)</Text>
  </View>
);

// مكون التنقل بين الشاشات الرئيسية
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Research') {
          iconName = 'description';
        } else if (route.name === 'Thesis') {
          iconName = 'school';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={PlaceholderScreen} 
      options={{ title: 'الرئيسية' }} 
    />
    <Tab.Screen 
      name="Research" 
      component={PlaceholderScreen} 
      options={{ title: 'الأبحاث' }} 
    />
    <Tab.Screen 
      name="Thesis" 
      component={PlaceholderScreen} 
      options={{ title: 'المذكرات' }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={PlaceholderScreen} 
      options={{ title: 'الملف الشخصي' }} 
    />
  </Tab.Navigator>
);

// مكون التنقل الجانبي
const DrawerNavigator = () => (
  <Drawer.Navigator>
    <Drawer.Screen 
      name="Main" 
      component={MainTabNavigator} 
      options={{ title: 'الرئيسية' }} 
    />
    <Drawer.Screen 
      name="Notifications" 
      component={PlaceholderScreen} 
      options={{ title: 'الإشعارات' }} 
    />
    <Drawer.Screen 
      name="References" 
      component={PlaceholderScreen} 
      options={{ title: 'الأرقام المرجعية' }} 
    />
  </Drawer.Navigator>
);

// مكون التنقل الرئيسي
const AppNavigator = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    // يمكن إضافة شاشة تحميل هنا
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // مسارات المصادقة
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // مسارات التطبيق الرئيسية
          <Stack.Screen name="Main" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;