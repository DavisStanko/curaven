import { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';

export default function FindMatchScreen() {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);

  async function handleFindMatch() {
    if (!user) return;

    setSearching(true);

    try {
      // Call the find_match Supabase RPC function
      // This should find an unmatched user and create a match row,
      // or put the current user in the queue.
      const { data, error } = await supabase.rpc('find_match', {
        current_user_id: user.id,
      });

      if (error) {
        Alert.alert('Error', error.message);
        setSearching(false);
        return;
      }

      if (data?.match_id) {
        // Match found — navigate to chat
        router.push(`/(main)/chat/${data.match_id}`);
      } else {
        Alert.alert(
          'Searching…',
          "You're in the queue! We'll match you as soon as someone else is looking too.",
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    }

    setSearching(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Friendr</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#8B8BA3" />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.bigCircle}>
            <Ionicons name="sparkles" size={64} color="#A855F7" />
          </View>
        </View>

        <Text style={styles.heading}>Ready to vibe?</Text>
        <Text style={styles.description}>
          Tap below to get matched 1:1 with a stranger for 24 hours. No names, no photos — just
          vibes.
        </Text>

        <TouchableOpacity
          style={[styles.findButton, searching && styles.findButtonDisabled]}
          onPress={handleFindMatch}
          disabled={searching}
          activeOpacity={0.8}
        >
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.findButtonText}>Find Match</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  signOutBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    marginBottom: 32,
  },
  bigCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#8B8BA3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  findButton: {
    backgroundColor: '#A855F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  findButtonDisabled: {
    opacity: 0.6,
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
});
