import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Card, Title, Paragraph, Button, Text, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAPI } from '../../contexts/APIContext';
import { useAuth } from '../../contexts/AuthContext';
import { VerificationResult } from '../../types';

const UploadScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const navigation = useNavigation();
  const { api } = useAPI();
  const { user } = useAuth();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setVerificationResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setVerificationResult(null);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    console.log('[Upload] Starting upload process');
    console.log('[Upload] Current user:', user);
    setUploading(true);
    try {
      // Convert image URI to File object for web
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], 'id_image.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('psm', '6');
      formData.append('oem', '3');

      console.log('[Upload] Making API request to /verify/');
      const apiResponse = await api.post('/verify/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[Upload] Upload successful:', apiResponse.data);
      setVerificationResult(apiResponse.data);
    } catch (error: any) {
      console.error('[Upload] Upload error:', error);
      console.error('[Upload] Error response:', error.response?.data);
      console.error('[Upload] Error status:', error.response?.status);
      console.error('[Upload] Full error details:', JSON.stringify(error.response?.data, null, 2));
      Alert.alert('Upload Failed', error.response?.data?.detail || 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const viewResult = () => {
    if (verificationResult) {
      navigation.navigate('VerificationResult' as never, { result: verificationResult } as never);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Upload ID Document</Title>
            <Paragraph style={styles.subtitle}>
              Take a photo or select an image from your gallery to verify an ID document.
            </Paragraph>

            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.image} />
                <Button
                  mode="outlined"
                  onPress={() => setSelectedImage(null)}
                  style={styles.removeButton}
                >
                  Remove Image
                </Button>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={takePhoto}
                icon="camera-alt"
                style={styles.button}
              >
                Take Photo
              </Button>

              <Button
                mode="outlined"
                onPress={pickImage}
                icon="photo-library"
                style={styles.button}
              >
                Choose from Gallery
              </Button>
            </View>

            {selectedImage && (
              <Button
                mode="contained"
                onPress={uploadImage}
                loading={uploading}
                disabled={uploading}
                style={styles.uploadButton}
                icon="cloud-upload"
              >
                {uploading ? 'Verifying...' : 'Verify Document'}
              </Button>
            )}

            {verificationResult && (
              <Card style={styles.resultCard}>
                <Card.Content>
                  <Title style={styles.resultTitle}>Verification Complete</Title>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>ID Number:</Text>
                    <Text style={styles.resultValue}>{verificationResult.id_number}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Status:</Text>
                    <Text style={[
                      styles.resultValue,
                      styles[`status${verificationResult.verification.charAt(0).toUpperCase() + verificationResult.verification.slice(1)}`]
                    ]}>
                      {verificationResult.verification.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Confidence:</Text>
                    <Text style={styles.resultValue}>{verificationResult.confidence.toFixed(1)}%</Text>
                  </View>
                  {verificationResult.image_similarity && (
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Face Match:</Text>
                      <Text style={styles.resultValue}>
                        {(verificationResult.image_similarity * 100).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                  <Button
                    mode="contained"
                    onPress={viewResult}
                    style={styles.viewResultButton}
                  >
                    View Full Results
                  </Button>
                </Card.Content>
              </Card>
            )}
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
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 225,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeButton: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  uploadButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  resultCard: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2196F3',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    color: '#666',
  },
  statusLegit: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusFake: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  statusUnknown: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  viewResultButton: {
    marginTop: 12,
  },
});

export default UploadScreen;
