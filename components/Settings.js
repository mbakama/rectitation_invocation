import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemeSettings from './ThemeSettings';
import RecitationSettings from './RecitationSettings';
import HistorySettings from './HistorySettings';
import Introduction from './Introduction';

const { width } = Dimensions.get('window');

export default function Settings({ 
  theme, 
  onThemeChange, 
  onClose, 
  themes, 
  currentTheme,
  recitationSettings,
  onSaveRecitationSettings,
  sessions
}) {
  const [currentPage, setCurrentPage] = useState('main');
  const [showIntro, setShowIntro] = useState(false);

  const handleBack = () => {
    if (currentPage === 'main') {
      onClose();
    } else {
      setCurrentPage('main');
    }
  };

  if (currentPage === 'theme') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: theme.button }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.secondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Thèmes</Text>
        </View>
        <ThemeSettings
          theme={theme}
          themes={themes}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
          onBack={handleBack}
        />
      </View>
    );
  }

  if (currentPage === 'recitation') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: theme.button }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.secondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Récitation</Text>
        </View>
        <RecitationSettings
          theme={theme}
          settings={recitationSettings}
          onBack={handleBack}
          onSave={onSaveRecitationSettings}
        />
      </View>
    );
  }

  if (currentPage === 'history') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: theme.button }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.secondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Historique</Text>
        </View>
        <HistorySettings
          theme={theme}
          sessions={sessions}
          onBack={handleBack}
        />
      </View>
    );
  }

  const menuItems = [
    {
      id: 'intro',
      title: 'Guide & Introduction',
      icon: 'book-outline',
      description: 'Découvrez l\'importance spirituelle et l\'utilisation de l\'application',
      color: '#9B59B6',
      category: 'Aide'
    },
    {
      id: 'recitation',
      title: 'Récitation',
      icon: 'time-outline',
      description: 'Configurez vos objectifs et horaires quotidiens',
      color: '#FF6B6B',
      category: 'Paramètres Principaux'
    },
    {
      id: 'history',
      title: 'Historique',
      icon: 'calendar-outline',
      description: 'Consultez et analysez votre progression',
      color: '#45B7D1',
      category: 'Paramètres Principaux'
    },
    {
      id: 'theme',
      title: 'Apparence',
      icon: 'color-palette-outline',
      description: 'Personnalisez les couleurs et le thème',
      color: '#4ECDC4',
      category: 'Personnalisation'
    }
  ];

  // Grouper les éléments par catégorie
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: theme.button }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Paramètres</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>
              {category}
            </Text>
            <View style={styles.menuList}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    { 
                      backgroundColor: theme.button,
                    }
                  ]}
                  onPress={() => {
                    if (item.id === 'intro') {
                      setShowIntro(true);
                    } else {
                      setCurrentPage(item.id);
                    }
                  }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDescription, { color: theme.secondary }]}>
                      {item.description}
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={theme.secondary} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Introduction
        visible={showIntro}
        onClose={() => setShowIntro(false)}
        theme={theme}
      />
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
    padding: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  menuList: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  arrowContainer: {
    padding: 4,
  },
});
