import { createRoute } from "@granite-js/react-native";
import { MainUploadScreen } from "./main/MainUploadScreen";

export const Route = createRoute("/", {
  component: MainUploadScreen,
});
