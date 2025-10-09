import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const WaitingApprovalScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    logout();
    navigation.navigate('Login' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⏳</Text>
            </View>
            
            <Title style={styles.title}>Account Pending Approval</Title>
            
            <Paragraph style={styles.description}>
              Your police account has been created successfully. However, it requires admin approval before you can access the system.
            </Paragraph>
            
            <Paragraph style={styles.description}>
              Please wait for an administrator to review and approve your account. You will be notified once your account is approved.
            </Paragraph>
            
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>• Admin will review your registration details</Text>
              <Text style={styles.infoText}>• You'll receive approval notification</Text>
              <Text style={styles.infoText}>• You can then log in and use the app</Text>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              Back to Login
            </Button>
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
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF9800',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default WaitingApprovalScreen;


