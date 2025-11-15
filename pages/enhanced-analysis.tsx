import { createRoute, useNavigation } from '@granite-js/react-native';
import React from 'react';
import { EnhancedAnalysisScreen } from '../src/pages/enhanced-analysis/EnhancedAnalysisScreen';
import { useAnalysisNavigationStore } from '../src/store/analysisNavigation';

export const Route = createRoute('/enhanced-analysis', {
  component: EnhancedAnalysisPage,
});

function EnhancedAnalysisPage() {
  const navigation = useNavigation();
  const { navigationData, clearNavigationData } = useAnalysisNavigationStore();

  const routeParams = navigationData
    ? {
      imageUri: navigationData.imageUri,
      analysisResult: navigationData.analysisResult,
      entryType: navigationData.entryType,
    }
    : {
      imageUri:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      analysisResult: {
        isHealthy: true,
        mainIngredients: ['rice', 'chicken'],
        estimatedCalories: 500,
        mealType: 'lunch',
        date: '2024-11-02',
        confidence: 0.9,
      },
      entryType: 'food' as const,
    };

  React.useEffect(() => {
    return () => {
      clearNavigationData();
    };
  }, [clearNavigationData]);

  return (
    <EnhancedAnalysisScreen
      navigation={navigation}
      route={{ params: routeParams }}
    />
  );
}
