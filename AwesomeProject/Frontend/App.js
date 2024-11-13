import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import FDAScreen from './src/screens/FDAScreen';
import K510Screen from './src/screens/K510Screen';
import CDPHScreen from './src/screens/CDPHScreen';
import MaudeScreen from './src/screens/MaudeScreen';
import RecallScreen from './src/screens/RecallScreen';
import K510ResultsScreen from './src/screens/K510ResultsScreen';
import CDPHResultsScreen from './src/screens/CDPHResultsScreen';
import MaudeResultsScreen from './src/screens/MaudeResultsScreen';
import PDFViewer from './src/screens/PDFViewer';
import OpenHistoricalScreen from './src/screens/OpenHistoricalScreen';
import OpenHistoricalResultsScreen from './src/screens/OpenHistoricalResultsScreen';
import CAEntitySearchScreen from './src/screens/CAEntitySearchScreen';
import CAEntityResultsScreen from './src/screens/CAEntityResultsScreen';
import ContactFetchScreen from './src/screens/ContactFetchScreen';
import PredictScreen from './src/screens/PredictScreen';
import WarningLetterScreen from './src/screens/WarningLetterScreen';
import WarningLetterResultsScreen from './src/screens/WarningLetterResultsScreen';
import LoginScreen from './src/screens/LoginScreen'; // Import the LoginScreen
import signUpScreen from './src/screens/SignUpScreen'; // Import the SignUpScreen
import ProtectedScreen from './src/screens/ProtectedScreen'; // Import the ProtectedScreen
import SAPScreen from './src/screens/SAPScreen'

import {Alert, BackHandler} from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';


const Stack = createNativeStackNavigator();

export default function App() {
  // checking for insecure iPadOS version
  const osVersion = Device.osVersion;
  const splitVersion = osVersion.split(".");

  if (splitVersion[0] != 17 && !(splitVersion[0] == "16" && parseInt(splitVersion[1], 10) >= 9) && !(splitVersion[0] == "15" && parseInt(splitVersion[1], 10) >= 7)) {
    Alert.alert(
      "iOS Out of Date",
      "Your iOS is " + osVersion + ", which is vulnerable to attack. Please update your iOS!",
      [
        {
          text: "OK",
          onPress: () => BackHandler.exitApp()
        }
      ]
    );
  }

  // checking for out-of-date app version
  const appVersion = Application.nativeApplicationVersion;
  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending
  } = Updates.useUpdates();

  if (isUpdateAvailable) {
    Alert.alert(
      "app Out of Date",
      "The version of the app is " + appVersion + ", which is vulnerable to attack. Please update the app!",
      [
        {
          text: "OK",
          onPress: () => BackHandler.exitApp()
        }
      ]
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="signUp" component={signUpScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="Protected" component={ProtectedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FDA" component={FDAScreen} />
        <Stack.Screen name="K510" component={K510Screen} />
        <Stack.Screen name="CDPH" component={CDPHScreen} />
        <Stack.Screen name="Maude" component={MaudeScreen} />
        <Stack.Screen name="Recall" component={RecallScreen} />
        <Stack.Screen name="K510ResultsScreen" component={K510ResultsScreen} />
        <Stack.Screen name="CDPHResultsScreen" component={CDPHResultsScreen} />
        <Stack.Screen name="MaudeResultsScreen" component={MaudeResultsScreen} />
        <Stack.Screen name="PDFViewer" component={PDFViewer} />
        <Stack.Screen name="OpenHistoricalScreen" component={OpenHistoricalScreen} />
        <Stack.Screen name="OpenHistoricalResultsScreen" component={OpenHistoricalResultsScreen} />
        <Stack.Screen name="CAEntitySearchScreen" component={CAEntitySearchScreen} />
        <Stack.Screen name="CAEntityResultsScreen" component={CAEntityResultsScreen} />
        <Stack.Screen name="ContactFetchScreen" component={ContactFetchScreen} />
        <Stack.Screen name="PredictScreen" component={PredictScreen} />
        <Stack.Screen name="WarningLetterScreen" component={WarningLetterScreen} />
        <Stack.Screen name="WarningLetterResultsScreen" component={WarningLetterResultsScreen} />
        <Stack.Screen name="SAPScreen" component={SAPScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
