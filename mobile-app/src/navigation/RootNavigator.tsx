/**
 * VerdictAI Root Navigation
 * Defines 2-root stacks: AuthStack (Welcome/Login/Verification) and MainStack (Bottom Tabs)
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { getAuthToken } from '../services/apiClient';
import { Colors } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Auth' | 'Main' | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getAuthToken();
        setInitialRoute(token ? 'Main' : 'Auth');
      } catch {
        setInitialRoute('Auth');
      }
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgDeep, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
