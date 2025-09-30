import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useAPI } from '../../contexts/APIContext';
import { User } from '../../types';

const PendingApprovalsScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const { api } = useAPI();

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/police-unapproved');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading pending users:', error);
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingUsers();
    setRefreshing(false);
  };

  const approveUser = async (userId: string) => {
    try {
      setProcessing(userId);
      await api.post(`/admin/approve-police/${userId}`);
      
      // Remove user from list
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      Alert.alert('Success', 'Police user approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const rejectUser = async (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this police user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(userId);
              await api.post(`/admin/reject-police/${userId}`);
              
              // Remove user from list
              setUsers(prev => prev.filter(user => user.id !== userId));
              
              Alert.alert('Success', 'Police user rejected successfully');
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <Title style={styles.userName}>{item.name}</Title>
          <Chip style={styles.pendingChip} textStyle={styles.pendingText}>
            PENDING
          </Chip>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{item.email}</Text>
          </View>
          
          {item.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{item.phone}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered:</Text>
            <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => approveUser(item.id)}
            loading={processing === item.id}
            disabled={processing !== null}
            style={[styles.actionButton, styles.approveButton]}
            icon="check"
          >
            Approve
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => rejectUser(item.id)}
            loading={processing === item.id}
            disabled={processing !== null}
            style={[styles.actionButton, styles.rejectButton]}
            icon="close"
          >
            Reject
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending approvals</Text>
            <Text style={styles.emptySubtext}>
              All police registrations have been processed
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
  listContainer: {
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  pendingChip: {
    backgroundColor: '#FF9800',
  },
  pendingText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  infoValue: {
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
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
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

export default PendingApprovalsScreen;


