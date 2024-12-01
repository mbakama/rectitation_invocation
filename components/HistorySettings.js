import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistorySettings({ sessions, theme, onBack }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
       
      <ScrollView style={styles.sessionList}>
        {sessions.map((session, index) => (
          <View 
            key={index}
            style={[styles.sessionItem, { backgroundColor: theme.button }]}
          >
            <Text style={[styles.sessionDate, { color: theme.secondary }]}>
              {session.date}
            </Text>
            <Text style={[styles.sessionCount, { color: theme.text }]}>
              {session.count} recitations
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  sessionList: {
    flex: 1,
  },
  sessionItem: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  sessionDate: {
    fontSize: 16,
  },
  sessionCount: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 5,
  },
});
