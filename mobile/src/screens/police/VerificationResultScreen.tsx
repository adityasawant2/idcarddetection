import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Chip, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { VerificationResult } from '../../types';

const VerificationResultScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const result: VerificationResult = route.params?.result;

  if (!result) {
    return (
      <View style={styles.container}>
        <Text>No verification result available</Text>
      </View>
    );
  }

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

  const goBack = () => {
    navigation.goBack();
  };

  const startNewVerification = () => {
    navigation.navigate('Upload' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>Verification Results</Title>
            <Paragraph style={styles.subtitle}>
              ID document verification completed
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.statusContainer}>
              <Chip
                icon={getStatusIcon(result.verification)}
                style={[styles.statusChip, { backgroundColor: getStatusColor(result.verification) }]}
                textStyle={styles.statusText}
              >
                {result.verification.toUpperCase()}
              </Chip>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Number:</Text>
                <Text style={styles.infoValue}>{result.id_number || 'Not detected'}</Text>
              </View>

              {result.image_similarity && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Face Similarity:</Text>
                  <Text style={styles.infoValue}>
                    {(result.image_similarity * 100).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {Object.keys(result.parsed_fields).length > 0 && (
          <Card style={styles.fieldsCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Extracted Information</Title>
              {Object.entries(result.parsed_fields).map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                  </Text>
                  <Text style={styles.fieldValue}>{String(value)}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {result.errors && result.errors.length > 0 && (
          <Card style={styles.errorsCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Issues Detected</Title>
              {result.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Actions</Title>
            <Button
              mode="contained"
              onPress={startNewVerification}
              style={styles.actionButton}
              icon="camera-alt"
            >
              Verify Another Document
            </Button>
            <Button
              mode="outlined"
              onPress={goBack}
              style={styles.actionButton}
              icon="arrow-back"
            >
              Back to Upload
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
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    marginTop: 4,
  },
  resultCard: {
    marginBottom: 16,
    elevation: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  fieldsCard: {
    marginBottom: 16,
  },
  errorsCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
  },
  actionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  fieldRow: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
  actionButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
});

export default VerificationResultScreen;
