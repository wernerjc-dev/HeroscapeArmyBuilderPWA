import { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createArmy } from '@/utils/armyStorage';

export default function CreateArmyScreen() {
  const router = useRouter();
  const [name, setName] = useState('New Army');
  const [pointTotal, setPointTotal] = useState('500');
  const [contemporaryOnly, setContemporaryOnly] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePointChange = (value: string) => {
    setPointTotal(value.replace(/[^0-9]/g, ''));
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const army = await createArmy(
        name.trim() || 'New Army',
        parseInt(pointTotal) || 500,
        contemporaryOnly
      );
      router.replace({ pathname: '/army-detail', params: { id: army.id } });
    } catch (error) {
      console.error('Error creating army:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Create Army</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'height' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Army Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter army name"
                placeholderTextColor="#666"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Point Total</Text>
              <TextInput
                style={styles.input}
                value={pointTotal}
                onChangeText={handlePointChange}
                placeholder="500"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.label}>Contemporary Only</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchDescription}>
                  Only show legal cards for tournament play
                </Text>
                <Switch
                  value={contemporaryOnly}
                  onValueChange={setContemporaryOnly}
                  trackColor={{ false: '#555', true: '#703095' }}
                  thumbColor={contemporaryOnly ? '#fff' : '#ccc'}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.createButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create & Start Building'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#101010',
  },
  backButton: {
    color: '#703095',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchGroup: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchDescription: {
    color: '#888',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  buttons: {
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#703095',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
