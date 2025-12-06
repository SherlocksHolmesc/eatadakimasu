import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  red700: '#b91c1c',
  rose50: '#fff1f2',
};

// Complete OAuth session for better UX
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginMutation = useMutation(api.auth.login);
  const loginWithGoogleMutation = useMutation(api.auth.loginWithGoogle);

  // Get Google Client ID from environment
  const googleClientId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                         process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Get redirect URI
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'frontend',
    path: 'auth',
  });

  // Log redirect URI for debugging (check console to see what to add to Google Cloud Console)
  React.useEffect(() => {
    if (googleClientId) {
      console.log('✅ Google Client ID loaded');
      console.log('🔗 Redirect URI:', redirectUri);
      console.log('📝 Add this exact URI to Google Cloud Console → OAuth 2.0 Client IDs → Authorized redirect URIs');
    } else {
      console.warn('⚠️ Google Client ID is missing. Please add EXPO_PUBLIC_GOOGLE_CLIENT_ID to app.json');
    }
  }, [googleClientId, redirectUri]);

  // Generate nonce for ID token flow (required by Google)
  const nonce = React.useMemo(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // Google OAuth configuration
  // Use implicit flow (ID token) - requires nonce, no PKCE
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: redirectUri,
      usePKCE: false, // Explicitly disable PKCE for implicit flow
      extraParams: {
        nonce: nonce, // Required for ID token flow
      },
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginMutation({
        email: email.toLowerCase().trim(),
        password,
      });

      // Store user data
      await AsyncStorage.setItem('userId', result.userId);
      await AsyncStorage.setItem('username', result.username);
      await AsyncStorage.setItem('email', result.email);

      // Navigate to landing
      router.replace('/landing');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = React.useCallback(async (idToken: string) => {
    try {
      // Decode the ID token to get user info (simplified - in production, verify JWT properly)
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode base64 URL-safe encoded JWT payload
      const base64Url = tokenParts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || payload.given_name || email.split('@')[0];

      // Call Convex mutation
      const result = await loginWithGoogleMutation({
        idToken,
        email,
        name,
        googleId,
      });

      // Store user data
      await AsyncStorage.setItem('userId', result.userId);
      await AsyncStorage.setItem('username', result.username);
      await AsyncStorage.setItem('email', result.email);

      // Navigate to landing
      router.replace('/landing');
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'Unable to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogleMutation, router]);

  // Handle Google OAuth response
  React.useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      handleGoogleLogin(response.params.id_token);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Google Login Failed', 'Unable to sign in with Google. Please try again.');
    }
  }, [response, handleGoogleLogin]);

  const handleGoogleSignIn = async () => {
    // Check if client ID is configured
    if (!googleClientId || googleClientId.trim() === '') {
      Alert.alert(
        'Configuration Error',
        'Google Client ID is not configured. Please add EXPO_PUBLIC_GOOGLE_CLIENT_ID to app.json extra section.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'dismiss') {
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Unable to open Google sign-in. Please try again.');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Background */}
      <View style={styles.bgGradient} />
      
      {/* Logo - PNG Ramen Bowl */}
      <Animated.View 
        style={styles.logoContainer}
        entering={FadeInDown.delay(200).springify()}
      >
        <Image
          source={require('../../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View 
        style={styles.titleContainer}
        entering={FadeInDown.delay(300).springify()}
      >
        <Text style={styles.title}>EATADAKIMASU</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </Animated.View>

      {/* Form */}
      <Animated.View 
        style={styles.formContainer}
        entering={FadeInDown.delay(400).springify()}
      >
        {/* Email field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={20} color={COLORS.stone400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.stone400}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Password field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={COLORS.stone400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.stone400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity 
          style={[styles.googleButton, (isLoading || isGoogleLoading) && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.8}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.rose50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.red600,
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.stone500,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.stone700,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.stone700,
  },
  loginButton: {
    backgroundColor: COLORS.red600,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.stone200,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.stone400,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    color: COLORS.stone600,
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.stone500,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.red600,
    fontWeight: '600',
  },
});

