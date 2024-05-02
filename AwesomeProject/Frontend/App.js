import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import FDAScreen from './src/screens/FDAScreen';
import K510Screen from './src/screens/K510Screen';
import AbbyScreen from './src/screens/AbbyScreen';
import MaudeScreen from './src/screens/MaudeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FDA" component={FDAScreen} />
        <Stack.Screen name="K510" component={K510Screen} />
        <Stack.Screen name="Abby" component={AbbyScreen} />
        <Stack.Screen name="Maude" component={MaudeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
