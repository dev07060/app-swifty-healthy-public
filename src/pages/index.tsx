import { createRoute } from "@granite-js/react-native";
import { useState } from "react";
import { LoginScreen } from "./login/LoginScreen";
import { MainUploadScreen } from "./main/MainUploadScreen";

function App() {
  // TODO: Set to false for production
  // Currently set to true to bypass login for development of other features
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <MainUploadScreen />;
}

export const Route = createRoute("/", {
  component: App,
});
