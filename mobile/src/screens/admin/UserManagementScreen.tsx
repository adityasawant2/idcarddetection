import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { useAPI } from '../../contexts/APIContext';
import { User } from '../../types';

const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { api } = useAPI();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Note: This endpoint would need to be implemented in the backend
      // For now, we'll show a placeholder
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // This would need to be implemented in the backend
      Alert.alert('Feature Coming Soon', 'User status toggle will be available in a future update');
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would need to be implemented in the backend
              Alert.alert('Feature Coming Soon', 'User deletion will be available in a future update');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{item.name}</Title>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.userStatus}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: item.is_approved ? '#4CAF50' : '#FF9800' }
              ]}
              textStyle={styles.statusText}
            >
              {item.is_approved ? 'APPROVED' : 'PENDING'}
            </Chip>
            <Chip
              style={[
                styles.roleChip,
                { backgroundColor: item.role === 'admin' ? '#2196F3' : '#9C27B0' }
              ]}
              textStyle={styles.roleText}
            >
              {item.role.toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.userDetails}>
          {item.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{item.phone}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Joined:</Text>
            <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => toggleUserStatus(item.id, item.is_approved)}
            style={[styles.actionButton, styles.toggleButton]}
            icon={item.is_approved ? 'block' : 'check'}
          >
            {item.is_approved ? 'Disable' : 'Enable'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => deleteUser(item.id, item.name)}
            style={[styles.actionButton, styles.deleteButton]}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'User management features are coming soon'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  userCard: {
    marginBottom: 16,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  userDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
  },
  toggleButton: {
    borderColor: '#2196F3',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default UserManagementScreen;


