import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
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

// Définir les sources des sons en dehors du composant
const SOUNDS = {
  light: {
    click: require('./assets/sound.mp3'),
    complete: require('./assets/complete.mp3'),
    volume: 0.5
  },
  dark: {
    click: require('./assets/sound.mp3'),
    complete: require('./assets/complete.mp3'),
    volume: 0.3
  },
  spiritual: {
    click: require('./assets/sound.mp3'),
    complete: require('./assets/complete.mp3'),
    volume: 0.4
  }
};

const TIMEZONE = 'Africa/Kinshasa';

export default function App() {
  const [count, setCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [completedRecitations, setCompletedRecitations] = useState([]);
  const [notifiedRecitations, setNotifiedRecitations] = useState([]);
  const [currentRecitationTime, setCurrentRecitationTime] = useState(null);
  const [lastResetDate, setLastResetDate] = useState(null);
  const [recitationSettings, setRecitationSettings] = useState({
    times: ['06:00'],
    count: 1,
    soundEnabled: true,
    volume: 0.5
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clickSound, setClickSound] = useState();
  const [completeSound, setCompleteSound] = useState();
  const [theme, setTheme] = useState('light');
  const [currentPage, setCurrentPage] = useState('main');

  // Charger les sons au démarrage de l'application
  useEffect(() => {
    async function loadSounds() {
      try {
        console.log('Chargement des sons...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        const clickSoundObject = new Audio.Sound();
        const completeSoundObject = new Audio.Sound();
        
        await clickSoundObject.loadAsync(SOUNDS[theme].click);
        await completeSoundObject.loadAsync(SOUNDS[theme].complete);
        
        await clickSoundObject.setVolumeAsync(SOUNDS[theme].volume);
        await completeSoundObject.setVolumeAsync(SOUNDS[theme].volume);
        
        setClickSound(clickSoundObject);
        setCompleteSound(completeSoundObject);
        console.log('Sons chargés avec succès');
      } catch (error) {
        console.error('Erreur de chargement des sons :', error);
      }
    }

    loadSounds();

    return () => {
      if (clickSound) {
        clickSound.unloadAsync();
      }
      if (completeSound) {
        completeSound.unloadAsync();
      }
    };
  }, [theme]); // Recharger les sons quand le thème change

  // Animation setup
  const scale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(1) }],
    };
  });

  const loadRecitationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('recitationSettings');
      console.log('Paramètres chargés:', savedSettings);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newSettings = {
          times: settings.times || ['06:00'],
          count: settings.count || 1,
          soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
          volume: settings.volume || 0.5
        };
        console.log('Nouveaux paramètres:', newSettings);
        setRecitationSettings(newSettings);
        setSoundEnabled(newSettings.soundEnabled);
      }
    } catch (error) {
      console.error('Erreur de chargement des paramètres de récitation :', error);
    }
  };

  const loadCompletedRecitations = async () => {
    try {
      const saved = await AsyncStorage.getItem('completedRecitations');
      if (saved) {
        const completed = JSON.parse(saved);
        setCompletedRecitations(Array.isArray(completed) ? completed : []);
      } else {
        setCompletedRecitations([]);
      }
    } catch (error) {
      console.error('Erreur de chargement des récitations complétées:', error);
      setCompletedRecitations([]);
    }
  };

  const saveCompletedRecitations = async (newCompleted) => {
    try {
      if (!Array.isArray(newCompleted)) {
        console.error('saveCompletedRecitations: newCompleted n\'est pas un tableau', newCompleted);
        return;
      }
      await AsyncStorage.setItem('completedRecitations', JSON.stringify(newCompleted));
      setCompletedRecitations(newCompleted);
    } catch (error) {
      console.error('Erreur de sauvegarde des récitations terminées :', error);
    }
  };

  const saveRecitationSettings = async (settings) => {
    try {
      console.log('Sauvegarde des paramètres:', settings);
      await AsyncStorage.setItem('recitationSettings', JSON.stringify(settings));
      setRecitationSettings(settings);
      setSoundEnabled(settings.soundEnabled);
      // Réinitialiser l'état actuel pour prendre en compte les nouveaux paramètres
      setCurrentRecitationTime(null);
      setCompletedRecitations([]);
      // Vérifier immédiatement les nouveaux horaires
      setTimeout(checkRecitationTime, 100);
    } catch (error) {
      console.error('Erreur de sauvegarde des paramètres de récitation :', error);
      Alert.alert('Erreur', 'Échec de la sauvegarde des paramètres de récitation');
    }
  };

  const handleSettingsSave = async (newSettings) => {
    try {
      console.log('Nouveaux paramètres reçus:', newSettings);
      await saveRecitationSettings(newSettings);
      // Forcer une vérification immédiate
      setCurrentRecitationTime(null);
      setCompletedRecitations([]);
      checkRecitationTime();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const timeZone = 'Africa/Kinshasa';
    
    // Obtenir l'heure dans le fuseau horaire de Kinshasa
    const kinshasaTime = new Intl.DateTimeFormat('fr-CD', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const [hours, minutes] = kinshasaTime.split(':').map(Number);
    console.log(`Heure à Kinshasa: ${kinshasaTime}`);
    
    return {
      hours,
      minutes,
      timeStr: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    };
  };

  const checkRecitationTime = () => {
    const currentTime = getCurrentTime();
    console.log('Heure actuelle:', currentTime.timeStr);
    console.log('Paramètres de récitation:', recitationSettings);
    console.log('Récitations complétées aujourd\'hui:', completedRecitations.length);

    let missedRecitations = [];
    let nextRecitationTime = null;

    // Trier les heures de récitation
    const sortedTimes = [...recitationSettings.times].sort();

    // Convertir l'heure actuelle en minutes depuis minuit pour faciliter la comparaison
    const nowInMinutes = currentTime.hours * 60 + currentTime.minutes;
    console.log('Minutes actuelles depuis minuit:', nowInMinutes);

    for (const time of sortedTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      // Convertir l'heure de récitation en minutes depuis minuit
      const recitationTimeInMinutes = hours * 60 + minutes;
      console.log(`Heure de récitation ${time}: ${recitationTimeInMinutes} minutes depuis minuit`);

      const isPassed = nowInMinutes > recitationTimeInMinutes;
      const isCompleted = completedRecitations.includes(time);
      const isExactTime = nowInMinutes === recitationTimeInMinutes;

      console.log(`Vérification de l'heure ${time}:
        - Minutes actuelles: ${nowInMinutes}
        - Minutes de récitation: ${recitationTimeInMinutes}
        - Est l'heure exacte: ${isExactTime}
        - Est passée: ${isPassed}
        - Est complétée: ${isCompleted}
      `);

      // Vérifier si c'est exactement l'heure de récitation
      if (isExactTime && !isCompleted) {
        console.log(`C'est l'heure de la récitation de ${time}!`);
        handleRecitationTime(time);
      }

      if (isPassed && !isCompleted) {
        console.log(`Récitation manquée trouvée: ${time}`);
        missedRecitations.push(time);
      }

      if (!isPassed && !isCompleted) {
        if (!nextRecitationTime) {
          nextRecitationTime = time;
        }
      }
    }

    // Gérer les récitations manquées
    if (missedRecitations.length > 0) {
      const missedTimes = missedRecitations.join(', ');
      console.log(`Récitations manquées: ${missedTimes}`);
      
      // Notifier pour chaque récitation manquée qui n'est pas déjà notifiée
      missedRecitations.forEach(time => {
        if (time !== currentRecitationTime) {
          handleMissedRecitation(time);
        }
      });

      // Définir la première récitation manquée comme récitation actuelle
      if (missedRecitations[0] !== currentRecitationTime) {
        setCurrentRecitationTime(missedRecitations[0]);
      }
    } else if (nextRecitationTime && nextRecitationTime !== currentRecitationTime) {
      console.log('Nouvelle prochaine récitation:', nextRecitationTime);
      setCurrentRecitationTime(nextRecitationTime);
    } else if (!nextRecitationTime && missedRecitations.length === 0) {
      // Toutes les récitations sont complétées pour aujourd'hui
      console.log('Toutes les récitations sont complétées pour aujourd\'hui');
      setCurrentRecitationTime(null);
    }
  };

  const checkDayChange = async () => {
    const timeZone = 'Africa/Kinshasa';
    const now = new Date();
    
    const kinshasaDate = new Intl.DateTimeFormat('fr-CD', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    const lastResetDate = await AsyncStorage.getItem('lastResetDate');
    
    if (!lastResetDate || lastResetDate !== kinshasaDate) {
      console.log('Nouveau jour détecté à Kinshasa, réinitialisation des récitations');
      await AsyncStorage.setItem('lastResetDate', kinshasaDate);
      await AsyncStorage.setItem('completedRecitations', JSON.stringify([]));
      setCompletedRecitations([]);
      setNotifiedRecitations([]); // Réinitialiser les notifications
      
      // Annuler toutes les notifications existantes
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  };

  // Initialisation de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Demander la permission pour les notifications
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Permission de notification refusée');
          return;
        }

        // Configurer les notifications
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Charger dans le bon ordre
        await checkDayChange();
        await loadRecitationSettings();
        await loadCompletedRecitations();
        
        // Vérifier immédiatement les récitations
        checkRecitationTime();
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
      }
    };

    initializeApp();
    
    // Vérifier l'heure toutes les 30 secondes au lieu de chaque minute
    const interval = setInterval(checkRecitationTime, 30000);
    // Vérifier immédiatement après l'initialisation
    setTimeout(checkRecitationTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRecitationTime = async (time) => {
    console.log(`Notification pour l'heure de récitation: ${time}`);
    const message = `C'est l'heure de votre récitation de ${time}`;
    await sendNotification('Heure de Récitation', message);
  };

  const handleMissedRecitation = async (time) => {
    // Vérifier si on a déjà notifié pour cette récitation
    if (notifiedRecitations.includes(time)) {
      return;
    }

    try {
      const identifier = `missed-${time}`;
      await Notifications.cancelScheduledNotificationAsync(identifier);
      
      // Planifier le rappel pour 30 minutes plus tard
      const trigger = new Date();
      trigger.setMinutes(trigger.getMinutes() + 30);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rappel de Récitation",
          body: `Vous avez manqué la récitation de ${time}. Allah'u'Abha !`,
          sound: true,
          priority: 'high',
        },
        trigger,
        identifier,
      });

      // Marquer cette récitation comme notifiée
      setNotifiedRecitations(prev => [...prev, time]);
      
      console.log(`Rappel planifié pour la récitation manquée de ${time} à ${trigger}`);
    } catch (error) {
      console.error('Erreur lors de la planification du rappel:', error);
    }
  };

  const playClickSound = async () => {
    try {
      if (soundEnabled && clickSound) {
        await clickSound.stopAsync();
        await clickSound.setPositionAsync(0);
        await clickSound.playAsync();
      }
    } catch (error) {
      console.error('Erreur de lecture du son de clic :', error);
    }
  };

  const playCompleteSound = async () => {
    try {
      if (soundEnabled && completeSound) {
        await completeSound.stopAsync();
        await completeSound.setPositionAsync(0);
        await completeSound.playAsync();
      }
    } catch (error) {
      console.error('Erreur de lecture du son de fin :', error);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    // Sauvegarder la préférence
    const newSettings = { ...recitationSettings, soundEnabled: !soundEnabled };
    setRecitationSettings(newSettings);
    saveRecitationSettings(newSettings);
  };

  const handlePress = async () => {
    // Permettre la récitation si une récitation est en attente (manquée ou actuelle)
    if (!currentRecitationTime && completedRecitations.length === 0) {
      const now = getCurrentTime();
      const nextTime = findNextRecitationTime();
      if (nextTime) {
        const [hours, minutes] = nextTime.split(':');
        const nextRecitationTime = new Date();
        nextRecitationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (now > nextRecitationTime) {
          Alert.alert(
            'Récitation non disponible',
            `La prochaine récitation est prévue à ${nextTime}. Veuillez attendre jusque là.`
          );
          return;
        } else {
          Alert.alert(
            'Récitation non disponible',
            'Vous avez manqué l\'heure de récitation d\'aujourd\'hui. Veuillez attendre la prochaine récitation programmée.'
          );
          return;
        }
      } else {
        Alert.alert(
          'Aucune récitation prévue',
          'Veuillez configurer vos horaires de récitation dans les paramètres.'
        );
        return;
      }
    }

    const newCount = count + 1;
    setCount(newCount);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await playClickSound();
    } catch (error) {
      console.error('Erreur avec le retour haptique :', error);
    }

    if (newCount === CLICKS_PER_RECITATION) {
      try {
        // Jouer le son de fin immédiatement
        await playCompleteSound();
        
        // Marquer cette récitation comme terminée avec l'horodatage
        const now = getCurrentTime();
        const newCompleted = [...completedRecitations, {
          time: currentRecitationTime,
          timestamp: now.timeStr,
          actualTime: now.timeStr
        }];
        await saveCompletedRecitations(newCompleted);
        
        // Sauvegarder la session
        const session = {
          date: now.timeStr,
          scheduledTime: currentRecitationTime,
          actualTime: now.timeStr,
          count: CLICKS_PER_RECITATION
        };
        await saveSession(session);

        // Réinitialiser le compteur et le temps actuel
        setCount(0);
        setCurrentRecitationTime(null);

        // Vérifier si c'était la dernière récitation
        if (newCompleted.length === recitationSettings.count) {
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
      } catch (error) {
        console.error('Erreur lors de la finalisation de la récitation:', error);
      }
    }
  };

  const findNextRecitationTime = () => {
    // Vérifier si les paramètres sont chargés
    if (!recitationSettings?.times) {
      return null;
    }

    const now = getCurrentTime();
    const currentTime = now.timeStr;
    
    return recitationSettings.times
      .filter(time => !completedRecitations?.some(rec => rec.time === time))
      .filter(time => time > currentTime)
      .sort()
      [0];
  };

  const checkAndResetDaily = async () => {
    const today = getCurrentTime().timeStr;
    try {
      const lastReset = await AsyncStorage.getItem('lastResetDate');
      
      if (lastReset !== today) {
        // Reset everything for the new day
        setCount(0);
        setCurrentRecitationTime(null);
        setCompletedRecitations([]);
        await AsyncStorage.setItem('lastResetDate', today);
        await AsyncStorage.setItem('completedRecitations', JSON.stringify([]));
        setLastResetDate(getCurrentTime());
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

  const handleThemeChange = (newTheme) => {
    cycleTheme(newTheme);
  };

  const handleRecitationSettingsChange = (newSettings) => {
    handleSettingsSave(newSettings);
  };

  const sendNotification = async (title, body) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
        },
        trigger: null, // notification immédiate
      });
    } catch (error) {
      console.error('Erreur d\'envoi de notification:', error);
    }
  };

  const getTimeStatus = () => {
    if (!currentRecitationTime) {
      return 'Toutes les récitations sont complétées';
    }

    const now = getCurrentTime();
    const [hours, minutes] = currentRecitationTime.split(':').map(Number);
    const recitationTime = new Date();
    recitationTime.setHours(hours, minutes, 0, 0);

    if (now > recitationTime) {
      return `Récitation manquée de ${currentRecitationTime}`;
    } else {
      return `Prochaine récitation à ${currentRecitationTime}`;
    }
  };

  // Vérifier si c'est la première installation
  useEffect(() => {
    const checkFirstInstall = async () => {
      try {
        const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
        if (!hasSeenIntro) {
          setShowIntroduction(true);
          await AsyncStorage.setItem('hasSeenIntro', 'true');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la première installation:', error);
      }
    };
    checkFirstInstall();
  }, []);

  // Fonction pour planifier un rappel pour une récitation manquée
  const scheduleMissedRecitationReminder = async () => {
    try {
      const identifier = 'missed-recitation-reminder';
      await Notifications.cancelScheduledNotificationAsync(identifier);
      
      const trigger = new Date();
      trigger.setMinutes(trigger.getMinutes() + 30);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rappel de Récitation",
          body: "Vous avez une récitation en attente. Allah'u'Abha !",
          sound: true,
          priority: 'high',
        },
        trigger,
        identifier,
      });
      console.log('Rappel planifié pour', trigger);
    } catch (error) {
      console.error('Erreur lors de la planification du rappel:', error);
    }
  };

  // Vérifier les récitations manquées
  const checkMissedRecitations = useCallback(async () => {
    try {
      const currentTime = new Date();
      const timeStr = format(currentTime, 'HH:mm', { timeZone: TIMEZONE });
      
      // Vérifier si l'heure actuelle est après une heure de récitation et qu'elle n'a pas été faite
      const missedRecitation = recitationSettings.times.some(time => {
        const [hours, minutes] = time.split(':');
        const recitationTime = new Date();
        recitationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Si l'heure actuelle est dans les 2 heures après l'heure de récitation
        // et que la récitation n'a pas été faite
        const timeDiff = (currentTime - recitationTime) / (1000 * 60); // différence en minutes
        return timeDiff > 0 && timeDiff < 120 && !completedRecitations.includes(time);
      });

      if (missedRecitation) {
        await scheduleMissedRecitationReminder();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des récitations manquées:', error);
    }
  }, [recitationSettings.times, completedRecitations]);

  // Ajouter checkMissedRecitations à useEffect pour la vérification périodique
  useEffect(() => {
    const interval = setInterval(checkMissedRecitations, 5 * 60 * 1000); // Vérifier toutes les 5 minutes
    return () => clearInterval(interval);
  }, [checkMissedRecitations]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        backgroundColor={currentTheme.background}
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      
      <Introduction 
        visible={showIntroduction} 
        onClose={() => setShowIntroduction(false)}
        theme={themes[theme]}
      />

      {currentPage === 'settings' ? (
        <Settings
          theme={currentTheme}
          themes={themes}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          onClose={() => setCurrentPage('main')}
          recitationSettings={recitationSettings}
          onSaveRecitationSettings={handleRecitationSettingsChange}
          sessions={sessions}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
        />
      ) : (
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

          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>
              {getTimeStatus()}
            </Text>
          </View>

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
              {`${completedRecitations.length}/${recitationSettings.count} récitations terminées aujourd'hui`}
            </Text>
          </View>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
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
