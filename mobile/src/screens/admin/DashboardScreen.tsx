import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useAPI } from '../../contexts/APIContext';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  totalLogs: number;
  recentVerifications: number;
}

const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    totalLogs: 0,
    recentVerifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const { api } = useAPI();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load pending approvals
      const approvalsResponse = await api.get('/admin/police-unapproved');
      const pendingApprovals = approvalsResponse.data.length;

      // Load recent logs (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const logsResponse = await api.get('/admin/logs', {
        params: {
          start_date: yesterday.toISOString(),
          limit: 1000,
        },
      });
      const recentVerifications = logsResponse.data.length;

      // Load total logs
      const totalLogsResponse = await api.get('/admin/logs', {
        params: {
          limit: 1,
        },
      });
      const totalLogs = totalLogsResponse.data.length;

      setStats({
        totalUsers: 0, // Would need a separate endpoint
        pendingApprovals,
        totalLogs,
        recentVerifications,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToApprovals = () => {
    // Navigation would be handled by the tab navigator
  };

  const navigateToLogs = () => {
    // Navigation would be handled by the tab navigator
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>Welcome, {user?.name}!</Title>
            <Paragraph style={styles.welcomeText}>
              You are logged in as an Administrator. Manage the ID verification system from here.
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.pendingApprovals}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.recentVerifications}</Text>
              <Text style={styles.statLabel}>Recent Verifications</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.totalLogs}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <Button
              mode="contained"
              onPress={navigateToApprovals}
              style={styles.actionButton}
              icon="pending-actions"
            >
              Review Pending Approvals
            </Button>
            
            <Button
              mode="outlined"
              onPress={navigateToLogs}
              style={styles.actionButton}
              icon="history"
            >
              View All Logs
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>System Status</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Database:</Text>
              <Text style={[styles.statusValue, styles.online]}>Online</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>OCR Service:</Text>
              <Text style={[styles.statusValue, styles.online]}>Online</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Face Matching:</Text>
              <Text style={[styles.statusValue, styles.online]}>Online</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.helpCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Admin Functions</Title>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>👥</Text>
              <Text style={styles.helpText}>Approve or reject police registrations</Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>📊</Text>
              <Text style={styles.helpText}>Monitor all verification activities</Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🔍</Text>
              <Text style={styles.helpText}>Search and filter verification logs</Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>⚙️</Text>
              <Text style={styles.helpText}>Manage user accounts and permissions</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
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
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#4CAF50',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  helpCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  actionButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusValue: {
    fontSize: 14,
    color: '#666',
  },
  online: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
});

export default AdminDashboardScreen;


