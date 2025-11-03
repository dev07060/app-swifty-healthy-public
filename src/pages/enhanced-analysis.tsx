import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { EnhancedAnalysisScreen } from './enhanced-analysis/EnhancedAnalysisScreen';
import { useAnalysisNavigationStore } from '../store/analysisNavigation';

export const Route = createRoute('/enhanced-analysis', {
    component: EnhancedAnalysisPage,
});

function EnhancedAnalysisPage() {
    const navigation = Route.useNavigation();
    const { navigationData, clearNavigationData } = useAnalysisNavigationStore();
    
    // Debug logging removed
    
    // Use navigation data from store or fallback to default for testing
    const routeParams = navigationData ? {
        imageUri: navigationData.imageUri,
        analysisResult: navigationData.analysisResult,
        entryType: navigationData.entryType
    } : {
        imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop', // Sample food image
        analysisResult: {
            isHealthy: true,
            mainIngredients: ['rice', 'chicken'],
            estimatedCalories: 500,
            mealType: 'lunch',
            date: '2024-11-02',
            confidence: 0.9
        },
        entryType: 'food' as const
    };
    
    // Final routeParams logging removed
    
    // Clear navigation data when component unmounts to prevent stale data
    React.useEffect(() => {
        return () => {
            clearNavigationData();
        };
    }, [clearNavigationData]);
    
    return <EnhancedAnalysisScreen 
        navigation={navigation} 
        route={{ params: routeParams }} 
    />;
}