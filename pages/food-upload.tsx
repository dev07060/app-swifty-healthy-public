import { createRoute } from '@granite-js/react-native';
import { FoodUploadScreen } from '../src/pages/food-upload/FoodUploadScreen';

export const Route = createRoute('/food-upload', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <FoodUploadScreen navigation={navigation} />;
}
