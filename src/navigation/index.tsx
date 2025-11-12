import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from "../screens/Auth/Login";
import Signup from "../screens/Auth/Signup";
import Feed from "../screens/Home";
import CreatePost from "../screens/CreatePost";
import Profile from "../screens/Profile";
import ForgotPassword from "@screens/Auth/ForgotPassword";
import EditProfile from "@screens/EditProfile";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../../assets/logo-three.png";
import defaultAvatar from "../../assets/default-img.png";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomHeader({ rightComponent }: any) {
  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      }}
    >
      <View
        style={{
          maxWidth: 650,
          width: "85%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 85,
          backgroundColor: "#fff",
          paddingBottom: 10,
        }}
      >
        <Image source={Logo} style={{ height: 30, width: 70 }} />
        {rightComponent}
      </View>
    </View>
  );
}

function MainTabs({ navigation }: any) {
  const { user } = useAuth();
  const avatar = user?.avatar ? { uri: user.avatar } : defaultAvatar;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: {
          alignItems: "center",
          paddingTop: 15,
          borderWidth: 0,
          height: 80,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === "Feed") iconName = "home-outline";
          else if (route.name === "CreatePost") iconName = "add-circle-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Feed"
        component={Feed}
        options={{
          header: () => (
            <CustomHeader
              rightComponent={
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Profile" })
                  }
                >
                  <Image
                    source={avatar}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "#008CFF",
                    }}
                  />
                </TouchableOpacity>
              }
            />
          ),
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePost}
        options={{
          header: () => (
            <CustomHeader
              rightComponent={
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Profile" })
                  }
                >
                  <Image
                    source={avatar}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "#008CFF",
                    }}
                  />
                </TouchableOpacity>
              }
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          header: () => (
            <CustomHeader
              rightComponent={
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Profile" })
                  }
                >
                  <Image
                    source={avatar}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "#008CFF",
                    }}
                  />
                </TouchableOpacity>
              }
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
}
