import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Home, UserPlus, CircleUser } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BottomNavBarProps {
  activeTab: 'home' | 'friends' | 'profile';
  onTabChange: (tab: 'home' | 'friends' | 'profile') => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <NavButton
          icon={Home}
          isActive={activeTab === 'home'}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onTabChange('home');
          }}
        />
        <NavButton
          icon={UserPlus}
          isActive={activeTab === 'friends'}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onTabChange('friends');
          }}
        />
        <NavButton
          icon={CircleUser}
          isActive={activeTab === 'profile'}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onTabChange('profile');
          }}
        />
      </View>
    </View>
  );
}

interface NavButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  isActive: boolean;
  onPress: () => void;
}

function NavButton({ icon: Icon, isActive, onPress }: NavButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    opacity.value = withSpring(isActive ? 1 : 0);
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.activeBackground, backgroundStyle]} />
      <View style={styles.iconContainer}>
        <Icon
          size={24}
          color={isActive ? '#FFFFFF' : '#A8A29E'}
          strokeWidth={2}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F5F5F4',
  },
  button: {
    position: 'relative',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBackground: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#DC2626',
    borderRadius: 999,
  },
  iconContainer: {
    zIndex: 10,
  },
});

