import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const navigateToUpload = () => {
    navigation.navigate('Upload' as never);
  };

  const navigateToLogs = () => {
    navigation.navigate('PoliceLogs' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>Welcome, {user?.name}!</Title>
            <Paragraph style={styles.welcomeText}>
              You are logged in as a Police Officer. Use the options below to verify ID documents.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <Button
              mode="contained"
              onPress={navigateToUpload}
              style={styles.actionButton}
              icon="camera-alt"
            >
              Verify ID Document
            </Button>
            
            <Button
              mode="outlined"
              onPress={navigateToLogs}
              style={styles.actionButton}
              icon="history"
            >
              View My Logs
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>How to Use</Title>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Tap "Verify ID Document" to start</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Take a photo or select from gallery</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Review the verification results</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>View logs to track your verifications</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statusCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Account Status</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Role:</Text>
              <Text style={styles.statusValue}>Police Officer</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, styles.approved]}>Approved</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Email:</Text>
              <Text style={styles.statusValue}>{user?.email}</Text>
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
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
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
  actionCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  statusCard: {
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
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
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
  approved: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;


