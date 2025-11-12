import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Navigation from "./src/navigation";
import { AuthProvider } from "./src/context/AuthContext";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
          <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
}
