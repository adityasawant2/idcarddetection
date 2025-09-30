import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const { register } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    console.log('[UI] RegisterScreen mounted');
  }, []);

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleRegister = async () => {
    console.log('[UI] Register button clicked');
    console.log('[UI] Form data:', { email, name, phone, passwordLength: password.length });
    
    // Validate required fields
    if (!email || !password || !name) {
      console.log('[UI] Register validation failed: missing required fields', { hasEmail: !!email, hasPassword: !!password, hasName: !!name });
      showMessage('Please fill in all required fields (Name, Email, Password)', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      console.log('[UI] Register validation failed: password too short');
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password.length > 72) {
      console.log('[UI] Register validation failed: password too long');
      showMessage('Password must be 72 characters or less', 'error');
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      console.log('[UI] Register validation failed: passwords do not match');
      showMessage('Passwords do not match. Please check and try again.', 'error');
      return;
    }

    console.log('[UI] Register starting network request');
    setLoading(true);
    try {
      console.log('[UI] Register button pressed', { email, name, phone });
      await register(email, password, name, phone);
      console.log('[UI] Register success');
      showMessage('Registration successful! You can now login once an admin approves your account.', 'success');
      // Navigate to login after a short delay
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 2000);
    } catch (error: any) {
      console.log('[UI] Register failed', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Register as Police</Title>
            <Paragraph style={styles.subtitle}>
              Create your police account
            </Paragraph>

            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              label="Password *"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <Text style={styles.helpText}>
              Password must be 6-72 characters long
            </Text>

            <TextInput
              label="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              onPressIn={() => console.log('[UI] Register button onPressIn')}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Register
            </Button>

            <Button
              mode="text"
              onPress={navigateToLogin}
              style={styles.loginButton}
            >
              Already have an account? Sign In
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
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  loginButton: {
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

export default RegisterScreen;
