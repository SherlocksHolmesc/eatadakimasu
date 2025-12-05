import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.pacmanEmoji}>🔴</Text>
        <Text style={styles.logo}>Eatadakimasu</Text>
        <Text style={styles.subtitle}>Let's decide where to eat!</Text>
      </View>

      {/* Mode Selection */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.modeButton, styles.filledButton]}
          onPress={() => router.push('/solo-setup')}
        >
          <Text style={styles.filledButtonText}>SOLO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, styles.outlinedButton]}
          onPress={() => router.push('/group-mode')}
        >
          <Text style={styles.outlinedButtonText}>GROUP</Text>
        </TouchableOpacity>
      </View>

      {/* Decoration */}
      <View style={styles.decorationContainer}>
        <Text style={styles.decorationText}>• • •</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  pacmanEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff2346',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  modeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledButton: {
    backgroundColor: '#ff2346',
  },
  filledButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff2346',
  },
  outlinedButtonText: {
    color: '#ff2346',
    fontSize: 18,
    fontWeight: 'bold',
  },
  decorationContainer: {
    marginTop: 60,
  },
  decorationText: {
    fontSize: 24,
    color: '#ff2346',
  },
});