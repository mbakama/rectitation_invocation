import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecitationSettings from './RecitationSettings';
import ThemeSettings from './ThemeSettings';
import HistorySettings from './HistorySettings';
import Introduction from './Introduction';

const APP_VERSION = '1.0.0';
const DEVELOPER = 'Hector Mbakama';

export default function Settings({ 
  theme, 
  onThemeChange, 
  onClose, 
  themes, 
  currentTheme,
  recitationSettings,
  onSaveRecitationSettings,
  sessions,
  soundEnabled,
  toggleSound
}) {
  const [currentPage, setCurrentPage] = useState(null);

  const handleBack = () => {
    if (currentPage) {
      setCurrentPage(null);
    } else {
      onClose();
    }
  };

  const menuItems = [
    {
      id: 'recitation',
      title: 'Récitations',
      icon: 'time-outline',
      description: 'Gérez vos horaires de récitation',
      color: '#2ECC71'
    },
    {
      id: 'sound',
      title: 'Sons',
      icon: 'volume-high-outline',
      description: 'Paramètres des sons et notifications',
      color: '#E74C3C'
    },
    {
      id: 'theme',
      title: 'Thème',
      icon: 'color-palette-outline',
      description: 'Personnalisez les couleurs et le thème',
      color: '#4ECDC4'
    },
    {
      id: 'history',
      title: 'Historique',
      icon: 'time-outline',
      description: 'Voir l\'historique des récitations',
      color: '#3498db'
    },
    {
      id: 'introduction',
      title: 'Introduction',
      icon: 'information-circle-outline',
      description: 'Guide d\'utilisation et informations',
      color: '#8E44AD'
    }
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'recitation':
        return (
          <RecitationSettings
            theme={theme}
            settings={recitationSettings}
            onSave={onSaveRecitationSettings}
            sessions={sessions}
          />
        );
      case 'sound':
        return (
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Sons</Text>
            <TouchableOpacity 
              style={[styles.soundToggle, { backgroundColor: theme.cardBackground }]}
              onPress={toggleSound}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>
                {soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
              </Text>
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>
        );
      case 'theme':
        return (
          <ThemeSettings
            theme={theme}
            themes={themes}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />
        );
      case 'history':
        return (
          <HistorySettings
            theme={theme}
            sessions={sessions}
          />
        );
      case 'introduction':
        return (
          <View style={styles.pageContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.pageTitle, { color: theme.text }]}>Introduction</Text>
              
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Alláh-u-Abhá</Text>
                
                <Text style={[styles.text, { color: theme.text }]}>
                  "Alláh-u-Abhá" signifie "Dieu est le Plus-Glorieux" en arabe. Cette invocation sacrée 
                  est un pilier central de la pratique spirituelle bahá'íe.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Importance Spirituelle</Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  La répétition de cette invocation divine 95 fois par jour est une obligation spirituelle 
                  prescrite par Bahá'u'lláh. Cette pratique aide à :
                </Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  • Développer une connexion spirituelle plus profonde{'\n'}
                  • Cultiver un état de méditation et de prière{'\n'}
                  • Renforcer notre conscience de la présence divine{'\n'}
                  • Créer un rythme spirituel quotidien
                </Text>

                <View style={[styles.quote, { backgroundColor: theme.button }]}>
                  <Text style={[styles.text, { color: theme.text }]}>
                    "Il a été décrété que tout croyant en Dieu... récite chaque jour et nuit 
                    quatre-vingt-quinze fois Alláh-u-Abhá."
                  </Text>
                  <Text style={[styles.emphasis, { color: theme.text }]}>- Bahá'u'lláh</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Utilisation de l'Application</Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  Cette application vous aide à :{'\n'}
                  • Compter précisément vos 95 récitations{'\n'}
                  • Maintenir un horaire régulier{'\n'}
                  • Suivre vos progrès quotidiens{'\n'}
                  • Créer une routine spirituelle
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommandations</Text>
                <Text style={[styles.text, { color: theme.text }]}>
                  • Choisissez un moment calme de la journée{'\n'}
                  • Trouvez un endroit tranquille{'\n'}
                  • Adoptez une posture respectueuse{'\n'}
                  • Concentrez-vous sur la signification de l'invocation{'\n'}
                  • Maintenez un rythme régulier dans votre récitation
                </Text>
              </View>
            </ScrollView>
          </View>
        );
      default:
        return (
          <ScrollView style={styles.content}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
                onPress={() => setCurrentPage(item.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color="white" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.menuItemDescription, { color: theme.secondary }]}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {currentPage ? menuItems.find(item => item.id === currentPage)?.title : 'Paramètres'}
        </Text>
      </View>

      {!currentPage ? (
        <ScrollView style={styles.content}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
              onPress={() => setCurrentPage(item.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={24} color="white" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.menuItemDescription, { color: theme.secondary }]}>
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.secondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        renderContent()
      )}
      
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.version, { color: theme.secondary }]}>Version {APP_VERSION}</Text>
        <Text style={[styles.developer, { color: theme.secondary }]}>Développé par {DEVELOPER}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
  },
  pageContent: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    marginBottom: 4,
  },
  developer: {
    fontSize: 12,
  },
  soundToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  quote: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  emphasis: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
});
