import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import Settings from './components/Settings';
import Introduction from './components/Introduction';

const CLICKS_PER_RECITATION = 95;

const themes = {
  light: {
    background: '#fff',
    text: '#2196F3',
    secondary: '#666',
    button: '#e0e0e0',
  },
  dark: {
    background: '#1a1a1a',
    text: '#4CAF50',
    secondary: '#888',
    button: '#333',
  },
  spiritual: {
    background: '#f0f7ff',
    text: '#673AB7',
    secondary: '#777',
    button: '#e1e8f0',
  }
};

export default function App() {
  const [count, setCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [theme, setTheme] = useState('light');
  const [showSettings, setShowSettings] = useState(false);
  const [recitationSettings, setRecitationSettings] = useState({
    timesPerDay: 1,
    recitationTimes: ['06:00']
  });
  const [lastResetDate, setLastResetDate] = useState(null);
  const [currentRecitationTime, setCurrentRecitationTime] = useState(null);
  const [completedRecitations, setCompletedRecitations] = useState([]);
  const [currentPage, setCurrentPage] = useState('main');

  // Animation setup
  const scale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(1) }],
    };
  });

  useEffect(() => {
    loadInitialData();
    checkFirstLaunch();
    const interval = setInterval(checkRecitationTime, 1000); // Vérifier chaque seconde
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadSessions(),
      loadRecitationSettings(),
      loadLastResetDate(),
      loadCompletedRecitations(),
    ]);
    checkAndResetDaily();
  };

  const loadCompletedRecitations = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedRecitations');
      if (completed) {
        setCompletedRecitations(JSON.parse(completed));
      }
    } catch (error) {
      console.error('Erreur de chargement des récitations terminées :', error);
    }
  };

  const saveCompletedRecitations = async (newCompleted) => {
    try {
      await AsyncStorage.setItem('completedRecitations', JSON.stringify(newCompleted));
      setCompletedRecitations(newCompleted);
    } catch (error) {
      console.error('Erreur de sauvegarde des récitations terminées :', error);
    }
  };

  const checkRecitationTime = useCallback(() => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    const today = now.toDateString();

    // Si nous n'avons pas encore vérifié aujourd'hui
    if (lastResetDate?.toDateString() !== today) {
      checkAndResetDaily();
      return;
    }

    // Vérifier les récitations du jour
    const todaysRecitations = completedRecitations.filter(rec => 
      new Date(rec.timestamp).toDateString() === today
    );

    // Si aucune récitation n'a été faite aujourd'hui et qu'une heure de récitation est passée
    const missedRecitationTime = recitationSettings.recitationTimes.find(time => {
      const [hours, minutes] = time.split(':');
      const recitationDateTime = new Date();
      recitationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return recitationDateTime < now && !todaysRecitations.length;
    });

    if (missedRecitationTime && currentRecitationTime === null) {
      // Activer le compteur pour la récitation manquée
      setCurrentRecitationTime(missedRecitationTime);
    }

    // Vérifier si c'est l'heure d'une nouvelle récitation
    const isRecitationTime = recitationSettings.recitationTimes.some(time => {
      return time === currentTime && !todaysRecitations.length;
    });

    if (isRecitationTime && currentRecitationTime === null) {
      setCurrentRecitationTime(currentTime);
      Alert.alert(
        'Heure de Récitation',
        'C\'est l\'heure de votre récitation programmée.',
        [{ text: 'OK' }]
      );
    }
  }, [recitationSettings, completedRecitations, currentRecitationTime, count, lastResetDate]);

  const handlePress = async () => {
    // Permettre la récitation si une récitation est en attente (manquée ou actuelle)
    if (!currentRecitationTime && completedRecitations.length === 0) {
      const now = new Date();
      const nextTime = findNextRecitationTime();
      if (nextTime) {
        const [hours, minutes] = nextTime.split(':');
        const nextRecitationTime = new Date();
        nextRecitationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (now < nextRecitationTime) {
          setCurrentRecitationTime(recitationSettings.recitationTimes[0]);
        } else {
          Alert.alert(
            'Récitation non disponible',
            'Vous avez manqué l\'heure de récitation d\'aujourd\'hui. Veuillez attendre la prochaine récitation programmée.'
          );
          return;
        }
      }
    }

    const newCount = count + 1;
    setCount(newCount);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await playSound();
    } catch (error) {
      console.error('Erreur avec le retour haptique :', error);
    }

    if (newCount === CLICKS_PER_RECITATION) {
      // Marquer cette récitation comme terminée avec l'horodatage
      const newCompleted = [...completedRecitations, {
        time: currentRecitationTime,
        timestamp: new Date().toISOString(),
        actualTime: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)
      }];
      await saveCompletedRecitations(newCompleted);
      
      // Sauvegarder la session
      const session = {
        date: new Date().toLocaleDateString(),
        scheduledTime: currentRecitationTime,
        actualTime: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
        count: CLICKS_PER_RECITATION
      };
      await saveSession(session);

      // Réinitialiser le compteur et le temps actuel
      setCount(0);
      setCurrentRecitationTime(null);

      // Vérifier si c'était la dernière récitation
      if (newCompleted.length === recitationSettings.timesPerDay) {
        Alert.alert(
          'Toutes les Récitations Terminées',
          'Félicitations ! Vous avez terminé toutes vos récitations pour aujourd\'hui.'
        );
      } else {
        const nextTime = findNextRecitationTime();
        Alert.alert(
          'Récitation Terminée',
          `Bien joué ! Votre prochaine récitation est prévue pour ${nextTime}.`
        );
      }
    }
  };

  const findNextRecitationTime = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    
    return recitationSettings.recitationTimes
      .filter(time => !completedRecitations.some(rec => rec.time === time))
      .filter(time => time > currentTime)
      .sort()
      [0];
  };

  const checkAndResetDaily = async () => {
    const today = new Date().toDateString();
    try {
      const lastReset = await AsyncStorage.getItem('lastResetDate');
      
      if (lastReset !== today) {
        // Reset everything for the new day
        setCount(0);
        setCurrentRecitationTime(null);
        setCompletedRecitations([]);
        await AsyncStorage.setItem('lastResetDate', today);
        await AsyncStorage.setItem('completedRecitations', JSON.stringify([]));
        setLastResetDate(new Date());
      }
    } catch (error) {
      console.error('Erreur de vérification/réinitialisation quotidienne :', error);
    }
  };

  const loadSessions = async () => {
    try {
      const savedSessions = await AsyncStorage.getItem('sessions');
      if (savedSessions !== null) {
        setSessions(JSON.parse(savedSessions));
      } else {
        setSessions([]); // Initialize with empty array if no data
      }
    } catch (error) {
      console.error('Erreur de chargement des sessions :', error);
      Alert.alert('Erreur', 'Échec du chargement des sessions');
      setSessions([]); // Fallback to empty array on error
    }
  };

  const saveSession = async (session) => {
    try {
      if (!Array.isArray(sessions)) {
        throw new Error('Sessions is not an array');
      }
      const newSession = session;
      const updatedSessions = [newSession, ...sessions].slice(0, 10);
      await AsyncStorage.setItem('sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Erreur de sauvegarde de la session :', error);
      Alert.alert('Erreur', 'Échec de la sauvegarde de la session');
    }
  };

  const loadRecitationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('recitationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setRecitationSettings({
          timesPerDay: settings.timesPerDay || 1,
          recitationTimes: settings.recitationTimes || ['06:00']
        });
      }
    } catch (error) {
      console.error('Erreur de chargement des paramètres de récitation :', error);
    }
  };

  const saveRecitationSettings = async (settings) => {
    try {
      await AsyncStorage.setItem('recitationSettings', JSON.stringify(settings));
      setRecitationSettings(settings);
    } catch (error) {
      console.error('Erreur de sauvegarde des paramètres de récitation :', error);
      Alert.alert('Erreur', 'Échec de la sauvegarde des paramètres de récitation');
    }
  };

  const loadLastResetDate = async () => {
    try {
      const date = await AsyncStorage.getItem('lastResetDate');
      setLastResetDate(date ? new Date(date) : null);
    } catch (error) {
      console.error('Erreur de chargement de la date de réinitialisation :', error);
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du premier lancement:', error);
    }
  };

  const cycleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const currentTheme = themes[theme];

  const playSound = async () => {
    try {
      await Audio.Sound.playAsync(require('./assets/sound.mp3'));
    } catch (error) {
      console.error('Erreur de lecture du son :', error);
    }
  };

  const handleThemeChange = (newTheme) => {
    cycleTheme(newTheme);
  };

  const handleRecitationSettingsChange = (newSettings) => {
    saveRecitationSettings(newSettings);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        backgroundColor={currentTheme.background}
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      
      {currentPage === 'main' ? (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setCurrentPage('settings')}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={currentTheme.text}
            />
          </TouchableOpacity>

          <View style={styles.counterContainer}>
            <Animated.View style={scale}>
              <TouchableOpacity
                onPress={handlePress}
                disabled={!currentRecitationTime}
                style={!currentRecitationTime ? styles.counterDisabled : null}
              >
                <Text style={[styles.counterText, { color: currentTheme.text }]}>
                  {count}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.instructionText, { color: currentTheme.secondary }]}>
              {currentRecitationTime
                ? `Appuyez pour compter (${CLICKS_PER_RECITATION - count} restants)`
                : 'En attente de l\'heure de récitation'}
            </Text>

            {currentRecitationTime && (
              <Text style={[styles.timeText, { color: currentTheme.secondary }]}>
                Récitation actuelle : {currentRecitationTime}
              </Text>
            )}

            <Text style={[styles.goalText, { color: currentTheme.secondary }]}>
              {`${completedRecitations.length}/${recitationSettings.timesPerDay} récitations terminées aujourd'hui`}
            </Text>
          </View>
        </View>
      ) : currentPage === 'settings' ? (
        <Settings
          theme={themes[theme]}
          themes={themes}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          onClose={() => setCurrentPage('main')}
          recitationSettings={recitationSettings}
          onSaveRecitationSettings={handleRecitationSettingsChange}
          sessions={sessions}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  counterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  counterText: {
    fontSize: 120,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  counterDisabled: {
    opacity: 0.7,
  },
  timeText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  goalText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
});
