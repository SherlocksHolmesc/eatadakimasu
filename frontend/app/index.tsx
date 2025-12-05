import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));
  const [pacmanPosition] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

    // Animate Pacman eating
    Animated.timing(pacmanPosition, {
      toValue: 1,
      duration: 3000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Navigate to landing after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/landing');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const translateX = pacmanPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 300],
  });

  return (
    <View style={styles.container}>
      {/* Logo/Title */}
      <Text style={styles.logo}>Eatadakimasu</Text>
      
      {/* Pacman Animation */}
      <View style={styles.animationContainer}>
        <Animated.View style={[styles.pacman, { transform: [{ translateX }] }]}>
          <Text style={styles.pacmanText}>🔴</Text>
        </Animated.View>
        
        {/* Dots being eaten */}
        <View style={styles.dotsContainer}>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
        </View>
      </View>

      {/* Loading Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <Text style={styles.loadingText}>Loading deliciousness...</Text>
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
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff2346',
    marginBottom: 60,
  },
  animationContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  pacman: {
    position: 'absolute',
    zIndex: 2,
  },
  pacmanText: {
    fontSize: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  dot: {
    fontSize: 24,
    color: '#ff2346',
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff2346',
    borderRadius: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});