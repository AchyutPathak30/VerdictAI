import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';

LogBox.ignoreLogs(['[VerdictAI]', 'Network error']);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
