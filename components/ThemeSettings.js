import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const themeNames = {
  light: 'Clair',
  dark: 'Sombre',
  sepia: 'Sépia',
  nature: 'Nature',
  ocean: 'Océan',
  sunset: 'Coucher de soleil'
};

export default function ThemeSettings({ theme, themes, currentTheme, onThemeChange, onBack }) {
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text }]}>Personnalisation</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(themes).map(([themeName, themeColors]) => (
          <TouchableOpacity
            key={themeName}
            style={[
              styles.themeItem,
              { 
                backgroundColor: themeColors.button,
                borderColor: themeName === theme ? currentTheme.primary : 'transparent',
              },
            ]}
            onPress={() => onThemeChange(themeName)}
          >
            <View style={styles.themePreview}>
              <View style={[styles.colorSwatch, { backgroundColor: themeColors.primary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: themeColors.secondary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: themeColors.background }]} />
            </View>
            <Text style={[styles.themeName, { color: themeColors.text }]}>
              {themeNames[themeName] || themeName}
            </Text>
            {themeName === theme && (
              <Ionicons name="checkmark-circle" size={24} color={currentTheme.primary} />
            )}
          </TouchableOpacity>
        ))}
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
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
  },
  themePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  themeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});
