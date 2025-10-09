import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const { login } = useAuth();
  const navigation = useNavigation();

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    console.log('[UI] Login button clicked');
    console.log('[UI] Login data:', { email, passwordLength: password.length });
    
    // Validate required fields
    if (!email || !password) {
      console.log('[UI] Login validation failed: missing fields');
      showMessage('Please enter both email and password', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('[UI] Login button pressed', { email });
      await login(email, password);
      console.log('[UI] Login success');
    } catch (error: any) {
      console.log('[UI] Login failed', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('incorrect') || 
            error.message.includes('wrong') ||
            error.message.includes('401') ||
            error.message.includes('unauthorized')) {
          errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
        } else if (error.message.includes('not approved') || 
                   error.message.includes('pending')) {
          errorMessage = 'Your account is pending admin approval. Please wait for approval or contact an administrator.';
        } else if (error.message.includes('network') || 
                   error.message.includes('fetch') ||
                   error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('not found') || 
                   error.message.includes('404')) {
          errorMessage = 'Account not found. Please check your email or register for a new account.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>ID Verification</Title>
            <Paragraph style={styles.subtitle}>
              Sign in to your account
            </Paragraph>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={navigateToRegister}
              style={styles.registerButton}
            >
              Don't have an account? Register
            </Button>
          </Card.Content>
        </Card>
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={[
          styles.snackbar,
          snackbarType === 'success' && styles.snackbarSuccess,
          snackbarType === 'error' && styles.snackbarError,
        ]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 16,
  },
  snackbar: {
    marginBottom: 20,
  },
  snackbarSuccess: {
    backgroundColor: '#4CAF50',
  },
  snackbarError: {
    backgroundColor: '#F44336',
  },
});

export default LoginScreen;
