import { createRoute } from '@granite-js/react-native';
import { FoodUploadScreen } from './food-upload/FoodUploadScreen';

export const Route = createRoute('/food-upload', {
    component: () => {
        const navigation = Route.useNavigation();
        return <FoodUploadScreen navigation={navigation} />;
    },
});
