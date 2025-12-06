import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

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
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.pacmanEmoji}>🔴</Text>
        <Text style={styles.logo}>Eatadakimasu</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || isGoogleLoading}
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
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 40,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ff2346',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pacmanEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff2346',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#ff2346',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#ff2346',
    fontWeight: 'bold',
  },
  decorationContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  decorationText: {
    fontSize: 24,
    color: '#ff2346',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

