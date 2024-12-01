import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TIMES = ['09:00', '15:00', '21:00'];

export default function RecitationSettings({ onBack, theme, onSave, settings }) {
  const [timesPerDay, setTimesPerDay] = useState(settings?.count || 1);
  const [recitationTimes, setRecitationTimes] = useState(settings?.times || [...DEFAULT_TIMES]);

  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('recitationSettings');
      if (savedSettings) {
        const { times, count } = JSON.parse(savedSettings);
        setRecitationTimes(times);
        setTimesPerDay(count);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    }
  };

  const saveSettings = async () => {
    try {
      // Récupérer les paramètres existants
      const existingSettings = await AsyncStorage.getItem('recitationSettings');
      const currentSettings = existingSettings ? JSON.parse(existingSettings) : {};
      
      // Fusionner avec les nouveaux paramètres
      const settings = {
        ...currentSettings,
        times: recitationTimes.slice(0, timesPerDay),
        count: timesPerDay,
        soundEnabled: currentSettings.soundEnabled !== undefined ? currentSettings.soundEnabled : true,
        volume: currentSettings.volume || 0.5
      };
      
      await AsyncStorage.setItem('recitationSettings', JSON.stringify(settings));
      onSave(settings);
      Alert.alert('Succès', 'Paramètres enregistrés avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les paramètres');
    }
  };

  const validateTimes = () => {
    const times = recitationTimes.slice(0, timesPerDay);
    for (let i = 0; i < times.length - 1; i++) {
      const time1 = new Date(`2000-01-01 ${times[i]}`);
      const time2 = new Date(`2000-01-01 ${times[i + 1]}`);
      const diffHours = (time2 - time1) / (1000 * 60 * 60);
      
      if (diffHours < 2) {
        Alert.alert(
          'Horaires invalides',
          'Les récitations doivent être espacées d\'au moins 2 heures'
        );
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (validateTimes()) {
      saveSettings();
    }
  };

  const adjustTime = (index, minutes) => {
    const newTimes = [...recitationTimes];
    const time = newTimes[index];
    const [hours, mins] = time.split(':').map(Number);
    
    let newMinutes = mins + minutes;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (hours + 1) % 24;
    } else if (newMinutes < 0) {
      newMinutes = 59;
      newHours = (hours - 1 + 24) % 24;
    }
    
    newTimes[index] = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    setRecitationTimes(newTimes);
    
    // Sauvegarder immédiatement après chaque ajustement
    const settings = {
      times: newTimes.slice(0, timesPerDay),
      count: timesPerDay,
      soundEnabled: true,
      volume: 0.5
    };
    onSave(settings);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Horaires de Récitation</Text>
      </View> */}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Nombre de récitations par jour
          </Text>
          <View style={styles.countSelector}>
            <TouchableOpacity
              style={[styles.countButton, { backgroundColor: theme.button }]}
              onPress={() => setTimesPerDay(Math.max(1, timesPerDay - 1))}
            >
              <Text style={[styles.countButtonText, { color: theme.text }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.countText, { color: theme.text }]}>{timesPerDay}</Text>
            <TouchableOpacity
              style={[styles.countButton, { backgroundColor: theme.button }]}
              onPress={() => setTimesPerDay(Math.min(3, timesPerDay + 1))}
            >
              <Text style={[styles.countButtonText, { color: theme.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Horaires des récitations
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.secondary }]}>
            Les récitations doivent être espacées d'au moins 2 heures
          </Text>
          {recitationTimes.slice(0, timesPerDay).map((time, index) => (
            <View key={index} style={styles.timeSelector}>
              <Text style={[styles.timeLabel, { color: theme.text }]}>
                Récitation {index + 1}
              </Text>
              <View style={styles.timeControls}>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.button }]}
                  onPress={() => adjustTime(index, -15)}
                >
                  <Ionicons name="remove" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.timeText, { color: theme.text }]}>{time}</Text>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.button }]}
                  onPress={() => adjustTime(index, 15)}
                >
                  <Ionicons name="add" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { 
              backgroundColor: theme.button,
              borderColor: theme.border,
              borderWidth: 1,
              shadowColor: theme.text,
              elevation: 3
            }
          ]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.text }]}>
            Enregistrer
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  timeSelector: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 8,
  },
  timeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
