import { createRoute } from '@granite-js/react-native';
import { LoginScreen } from './login/LoginScreen';

export const Route = createRoute('/food-upload', {
  component: () => {
    const navigation = Route.useNavigation();
    return <LoginScreen navigation={navigation} />;
  },
});
