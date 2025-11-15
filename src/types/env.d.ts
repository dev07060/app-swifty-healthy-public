declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL: string;
    API_KEY: string;
    GEMINI_API_KEY: string;
    GEMINI_API_URL: string;
    APP_ENV: 'development' | 'staging' | 'production';
    DEBUG_MODE: string;
    ENABLE_ANALYTICS: string;
    ENABLE_CRASH_REPORTING: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
