import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Introduction({ visible, onClose, theme }) {
  const styles = StyleSheet.create({
    modalView: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingTop: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 15,
      marginBottom: 10,
    },
    text: {
      fontSize: 16,
      color: theme.secondary,
      marginBottom: 15,
      lineHeight: 24,
    },
    quote: {
      fontStyle: 'italic',
      backgroundColor: theme.button,
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
    },
    closeButton: {
      padding: 10,
    },
    emphasis: {
      fontWeight: 'bold',
      color: theme.text,
    }
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Alláh-u-Abhá</Text>
          
          <Text style={styles.text}>
            "Alláh-u-Abhá" signifie "Dieu est le Plus-Glorieux" en arabe. Cette invocation sacrée 
            est un pilier central de la pratique spirituelle bahá'íe.
          </Text>

          <Text style={styles.subtitle}>Importance Spirituelle</Text>
          <Text style={styles.text}>
            La répétition de cette invocation divine 95 fois par jour est une obligation spirituelle 
            prescrite par Bahá'u'lláh. Cette pratique aide à :
          </Text>
          <Text style={styles.text}>
            • Développer une connexion spirituelle plus profonde{'\n'}
            • Cultiver un état de méditation et de prière{'\n'}
            • Renforcer notre conscience de la présence divine{'\n'}
            • Créer un rythme spirituel quotidien
          </Text>

          <View style={styles.quote}>
            <Text style={styles.text}>
              "Il a été décrété que tout croyant en Dieu... récite chaque jour et nuit 
              quatre-vingt-quinze fois Alláh-u-Abhá."
            </Text>
            <Text style={[styles.text, styles.emphasis]}>- Bahá'u'lláh</Text>
          </View>

          <Text style={styles.subtitle}>Utilisation de l'Application</Text>
          <Text style={styles.text}>
            Cette application vous aide à :{'\n'}
            • Compter précisément vos 95 récitations{'\n'}
            • Maintenir un horaire régulier{'\n'}
            • Suivre vos progrès quotidiens{'\n'}
            • Créer une routine spirituelle
          </Text>

          <Text style={styles.subtitle}>Recommandations</Text>
          <Text style={styles.text}>
            • Choisissez un moment calme de la journée{'\n'}
            • Trouvez un endroit tranquille{'\n'}
            • Adoptez une posture respectueuse{'\n'}
            • Concentrez-vous sur la signification de l'invocation{'\n'}
            • Maintenez un rythme régulier dans votre récitation
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
