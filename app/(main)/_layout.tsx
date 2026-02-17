import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/AuthProvider';

export default function MainLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  // Not logged in — bounce to login screen
  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F0F1A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0F0F1A' },
      }}
    >
      <Stack.Screen name="find" options={{ title: 'Find a Match', headerShown: false }} />
      <Stack.Screen
        name="chat/[id]"
        options={{
          title: 'Chat',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
});
