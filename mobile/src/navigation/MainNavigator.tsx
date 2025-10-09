import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Police Screens
import PoliceDashboardScreen from '../screens/police/DashboardScreen';
import UploadScreen from '../screens/police/UploadScreen';
import VerificationResultScreen from '../screens/police/VerificationResultScreen';
import PoliceLogsScreen from '../screens/police/LogsScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import PendingApprovalsScreen from '../screens/admin/PendingApprovalsScreen';
import AdminLogsScreen from '../screens/admin/LogsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PoliceStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PoliceDashboard" 
      component={PoliceDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Stack.Screen 
      name="Upload" 
      component={UploadScreen}
      options={{ title: 'Upload ID' }}
    />
    <Stack.Screen 
      name="VerificationResult" 
      component={VerificationResultScreen}
      options={{ title: 'Verification Result' }}
    />
    <Stack.Screen 
      name="PoliceLogs" 
      component={PoliceLogsScreen}
      options={{ title: 'My Logs' }}
    />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminDashboardScreen}
      options={{ title: 'Admin Dashboard' }}
    />
    <Stack.Screen 
      name="PendingApprovals" 
      component={PendingApprovalsScreen}
      options={{ title: 'Pending Approvals' }}
    />
    <Stack.Screen 
      name="AdminLogs" 
      component={AdminLogsScreen}
      options={{ title: 'All Logs' }}
    />
    <Stack.Screen 
      name="UserManagement" 
      component={UserManagementScreen}
      options={{ title: 'User Management' }}
    />
  </Stack.Navigator>
);

const MainTabs: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    // Use browser confirm for web compatibility
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        console.log('[UI] Logout confirmed by user');
        logout();
      } else {
        console.log('[UI] Logout cancelled by user');
      }
    } else {
      // Fallback to Alert for mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: logout,
          },
        ]
      );
    }
  };

  const LogoutButton = () => (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
      }}
    >
      <Icon name="logout" size={20} color="#2196F3" style={{ marginRight: 4 }} />
      <Text style={{ color: '#2196F3', fontSize: 14, fontWeight: '500' }}>Logout</Text>
    </TouchableOpacity>
  );

  if (user?.role === 'admin') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
              case 'AdminDashboard':
                iconName = 'dashboard';
                break;
              case 'PendingApprovals':
                iconName = 'pending-actions';
                break;
              case 'AdminLogs':
                iconName = 'history';
                break;
              case 'UserManagement':
                iconName = 'people';
                break;
              default:
                iconName = 'help';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
          headerRight: () => <LogoutButton />,
        })}
      >
        <Tab.Screen 
          name="AdminDashboard" 
          component={AdminDashboardScreen}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen 
          name="PendingApprovals" 
          component={PendingApprovalsScreen}
          options={{ title: 'Approvals' }}
        />
        <Tab.Screen 
          name="AdminLogs" 
          component={AdminLogsScreen}
          options={{ title: 'Logs' }}
        />
        <Tab.Screen 
          name="UserManagement" 
          component={UserManagementScreen}
          options={{ title: 'Users' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'PoliceDashboard':
              iconName = 'dashboard';
              break;
            case 'Upload':
              iconName = 'camera-alt';
              break;
            case 'PoliceLogs':
              iconName = 'history';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => <LogoutButton />,
      })}
    >
      <Tab.Screen 
        name="PoliceDashboard" 
        component={PoliceDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{ title: 'Upload' }}
      />
      <Tab.Screen 
        name="PoliceLogs" 
        component={PoliceLogsScreen}
        options={{ title: 'Logs' }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerificationResult"
        component={VerificationResultScreen}
        options={{ title: 'Verification Result' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
