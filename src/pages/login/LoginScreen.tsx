import { appLogin } from '@apps-in-toss/framework';
import { Button, Text } from '@toss/tds-react-native';
import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

interface LoginResponse {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
}

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [response, setResponse] = useState<LoginResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await appLogin();
      setResponse(result);

      console.debug('로그인 성공:', result.authorizationCode, result.referrer);
      
      // 로그인 성공 후 메인 페이지로 이동
      setTimeout(() => {
        onLoginSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </View>

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>로그인 성공!</Text>
            <View style={styles.responseContent}>
              <Text style={styles.responseLabel}>Authorization Code:</Text>
              <Text style={styles.responseValue}>{response.authorizationCode}</Text>
              
              <Text style={styles.responseLabel}>Referrer:</Text>
              <Text style={styles.responseValue}>{response.referrer}</Text>
            </View>
            <Text style={styles.redirectText}>잠시 후 메인 페이지로 이동합니다...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
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
