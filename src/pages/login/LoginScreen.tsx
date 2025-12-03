import { appLogin, appsInTossSignTossCert } from '@apps-in-toss/framework';
import { Button, Text } from '@toss/tds-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { tossAuthClient } from '../../services/tossAuthClient';
import { useAuthStore } from '../../store/authStore';



export function LoginScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, authStatus, setAuthenticating, setWaitingForUser, setPolling, setUser, setError: setAuthError, clearAuth } = useAuthStore();

  async function handleLogin() {
    try {
      setIsLoading(true);
      setError(null);
      clearAuth();
      
      // Step 1: Get authorization code (session key) from Toss app
      console.log('🔐 Step 1: Calling appLogin()...');
      const result = await appLogin();
      console.log('✅ Login success!');
      console.log('📦 Session Key (authorizationCode):', result.authorizationCode);
      console.log('📦 Referrer:', result.referrer);
      
      // TODO: Use the session key (authorizationCode) for further authentication
      // For now, we'll just log it and consider login successful
      
      /* 
      // Navigate to main screen after short delay
      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess();
        }, 2000);
      }
      */
      
      // Step 2: Request authentication from backend
      console.log('🔐 Step 2: Requesting auth from backend...');
      const authRequest = await tossAuthClient.requestAuthentication();
      console.log('✅ Auth request success!');
      console.log('📦 Transaction ID (txId):', authRequest.txId);
      setAuthenticating(authRequest.txId);
      
      // Step 3: Open Toss app for user authentication
      console.log('🔐 Step 3: Opening Toss app with txId:', authRequest.txId);
      setWaitingForUser();
      
      // Check if Toss app can be opened
      try {
        const canOpen = await Linking.canOpenURL('supertoss://');
        console.log('📱 Can open Toss app:', canOpen);
        
        if (!canOpen) {
          console.error('❌ Toss app is not installed or scheme is not whitelisted');
          // On Simulator, this will likely be false. 
          // We can't proceed with auth on Simulator without Toss app.
          throw new Error('Toss app is not installed');
        }
      } catch (linkError) {
        console.error('⚠️ Error checking Toss app scheme:', linkError);
        // Continue anyway as canOpenURL might fail on some configs but openURL might still work
      }

      // Call SDK to open Toss app
      // Don't await this call to prevent blocking if it hangs (especially on Simulator)
      console.log('📱 Calling appsInTossSignTossCert (non-blocking)...');
      appsInTossSignTossCert({
        txId: authRequest.txId,
      }).then(sdkResult => {
        console.log('📱 SDK call completed:', sdkResult);
      }).catch(sdkError => {
        console.error('❌ SDK call error:', sdkError);
      });
      
      // Step 4: Poll for completion and get user data
      console.log('🔐 Step 4: Polling for auth result...');
      setPolling();
      
      // Wait a bit before starting to poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const authResult = await tossAuthClient.pollForCompletion(
          authRequest.txId,
          60, // max 60 attempts = 2 minutes
          2000 // check every 2 seconds
        );
        
        console.log('✅ Auth completed successfully!');
        console.log('📦 User data received:', JSON.stringify(authResult.userData, null, 2));
        setUser(authResult.userData, authResult.txId);
        
        // Navigate to main screen after short delay
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess();
          }, 2000);
        }
      } catch (pollError) {
        console.error('❌ Polling/result error:', pollError);
        const errMsg = pollError instanceof Error ? pollError.message : 'Failed to get user data';
        setError(errMsg);
        setAuthError(errMsg);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Get status message based on auth state
  function getStatusMessage(): string {
    switch (authStatus) {
      case 'requesting':
        return 'Requesting authentication...';
      case 'waiting':
        return 'Please complete authentication in Toss app...';
      case 'polling':
        return 'Retrieving your information...';
      case 'success':
        return 'Authentication successful!';
      case 'error':
        return 'Authentication failed';
      default:
        return '';
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>토스 인증 로그인</Text>
        <Text style={styles.description}>
          토스 인증으로 로그인하세요
        </Text>

        <View style={styles.buttonContainer}>
          <Button 
            onPress={handleLogin} 
            disabled={isLoading || authStatus === 'waiting' || authStatus === 'polling'}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </View>

        {/* Status indicator */}
        {authStatus !== 'idle' && authStatus !== 'error' && (
          <View style={styles.statusContainer}>
            {authStatus !== 'success' && <ActivityIndicator size="small" color="#0066cc" />}
            <Text style={styles.statusText}>{getStatusMessage()}</Text>
          </View>
        )}

        {/* User information display */}
        {user && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>로그인 성공!</Text>
            <View style={styles.responseContent}>
              <Text style={styles.responseLabel}>이름:</Text>
              <Text style={styles.responseValue}>{user.name}</Text>
            </View>
            <Text style={styles.redirectText}>잠시 후 메인 페이지로 이동합니다...</Text>
          </View>
        )}

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              onPress={() => {
                setError(null);
                clearAuth();
              }}
            >
              다시 시도
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    minWidth: 200,
  },
  statusContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#0066cc',
    textAlign: 'center',
  },
  responseContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    width: '100%',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 16,
    textAlign: 'center',
  },
  responseContent: {
    gap: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  responseValue: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  redirectText: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fee',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
  },
});
