import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { useAPI } from '../../contexts/APIContext';
import { Log } from '../../types';

const LogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { api } = useAPI();

  const loadLogs = async (pageNum: number = 0, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/logs/', {
        params: {
          limit: 20,
          offset: pageNum * 20,
        },
      });

      const newLogs = response.data;
      
      if (pageNum === 0) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }

      setHasMore(newLogs.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs(0);
  }, []);

  const handleRefresh = () => {
    loadLogs(0, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLogs(page + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'legit':
        return '#4CAF50'; // Green for LEGIT
      case 'fake':
        return '#F44336'; // Red for FAKE
      case 'unknown':
        return '#FF9800'; // Orange for UNKNOWN
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'legit':
        return 'check-circle';
      case 'fake':
        return 'cancel';
      case 'unknown':
        return 'help';
      default:
        return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderLogItem = ({ item }: { item: Log }) => (
    <Card style={styles.logCard}>
      <Card.Content>
        <View style={styles.logHeader}>
          <Chip
            icon={getStatusIcon(item.verification_result)}
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.verification_result) }]}
            textStyle={styles.statusText}
          >
            {item.verification_result.toUpperCase()}
          </Chip>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        {item.dl_code_checked && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Number:</Text>
            <Text style={styles.infoValue}>{item.dl_code_checked}</Text>
          </View>
        )}

        {item.image_similarity && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Face Similarity:</Text>
            <Text style={styles.infoValue}>
              {(item.image_similarity * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No verification logs found</Text>
            <Text style={styles.emptySubtext}>
              Start by verifying an ID document to see your logs here
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
  logCard: {
    marginBottom: 12,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
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

export default LogsScreen;
