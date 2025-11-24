import { createRoute } from "@granite-js/react-native";
import { useState } from "react";
import { LoginScreen } from "./login/LoginScreen";
import { MainUploadScreen } from "./main/MainUploadScreen";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <MainUploadScreen />;
}

export const Route = createRoute("/", {
  component: App,
});
