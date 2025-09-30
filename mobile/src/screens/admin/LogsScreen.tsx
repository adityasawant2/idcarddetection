import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, ActivityIndicator, Searchbar, Menu, Button } from 'react-native-paper';
import { useAPI } from '../../contexts/APIContext';
import { Log, LogFilter } from '../../types';

const AdminLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filters, setFilters] = useState<LogFilter>({
    verification_result: undefined,
    limit: 50,
    offset: 0,
  });
  const { api } = useAPI();

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (searchQuery) {
        // Simple search by ID number
        params.user_id = searchQuery;
      }
      
      const response = await api.get('/admin/logs', { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Debounce search
    setTimeout(() => {
      if (query === searchQuery) {
        loadLogs();
      }
    }, 500);
  };

  const applyFilter = (field: keyof LogFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0, // Reset offset when filtering
    }));
    setFilterMenuVisible(false);
  };

  const clearFilters = () => {
    setFilters({
      verification_result: undefined,
      limit: 50,
      offset: 0,
    });
    setSearchQuery('');
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

        <View style={styles.logInfo}>
          {item.dl_code_checked && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Number:</Text>
              <Text style={styles.infoValue}>{item.dl_code_checked}</Text>
            </View>
          )}

          {item.police_user && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Officer:</Text>
              <Text style={styles.infoValue}>{item.police_user.name}</Text>
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
        </View>
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
      <View style={styles.header}>
        <Searchbar
          placeholder="Search by officer ID..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              icon="filter-list"
              style={styles.filterButton}
            >
              Filter
            </Button>
          }
        >
          <Menu.Item
            onPress={() => applyFilter('verification_result', undefined)}
            title="All Results"
          />
          <Menu.Item
            onPress={() => applyFilter('verification_result', 'legit')}
            title="Legitimate Only"
          />
          <Menu.Item
            onPress={() => applyFilter('verification_result', 'fake')}
            title="Fake Only"
          />
          <Menu.Item
            onPress={() => applyFilter('verification_result', 'unknown')}
            title="Unknown Only"
          />
        </Menu>
      </View>

      <View style={styles.filterInfo}>
        {filters.verification_result && (
          <Chip
            onClose={() => applyFilter('verification_result', undefined)}
            style={styles.filterChip}
          >
            {filters.verification_result.toUpperCase()}
          </Chip>
        )}
        {searchQuery && (
          <Chip
            onClose={() => setSearchQuery('')}
            style={styles.filterChip}
          >
            Search: {searchQuery}
          </Chip>
        )}
        {(filters.verification_result || searchQuery) && (
          <Button
            mode="text"
            onPress={clearFilters}
            style={styles.clearButton}
          >
            Clear All
          </Button>
        )}
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filters.verification_result
                ? 'Try adjusting your search or filters'
                : 'No verification logs available yet'
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
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    marginLeft: 8,
  },
  filterInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  clearButton: {
    marginLeft: 8,
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
  logInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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

export default AdminLogsScreen;
