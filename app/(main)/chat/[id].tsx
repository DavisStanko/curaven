import { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { VibeCheck } from '@/components/VibeCheck';

type MatchData = {
  id: string;
  user_a: string;
  user_b: string;
  user_a_checked: boolean;
  user_b_checked: boolean;
  created_at: string;
  expires_at: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine if current user is user_a or user_b
  const isUserA = match?.user_a === user?.id;
  const myChecked = isUserA ? match?.user_a_checked : match?.user_b_checked;
  const theirChecked = isUserA ? match?.user_b_checked : match?.user_a_checked;
  const bothChecked = match?.user_a_checked && match?.user_b_checked;

  useEffect(() => {
    fetchMatch();
    subscribeToMatch();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  async function fetchMatch() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', 'Could not load match.');
      setLoading(false);
      return;
    }

    setMatch(data);
    setLoading(false);
    startCountdown(data.expires_at);
  }

  function subscribeToMatch() {
    const channel = supabase
      .channel(`match:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setMatch(payload.new as MatchData);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function startCountdown(expiresAt: string) {
    function update() {
      const now = new Date().getTime();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }

    update();
    timerRef.current = setInterval(update, 1000);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#A855F7" />
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Match not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Timer */}
      <View style={styles.timerBar}>
        <Ionicons name="time-outline" size={18} color="#8B8BA3" />
        <Text style={styles.timerText}>{timeLeft}</Text>
      </View>

      {/* Chat area placeholder */}
      <View style={styles.chatArea}>
        <View style={styles.emptyChat}>
          <Ionicons name="chatbubbles-outline" size={48} color="#2A2A40" />
          <Text style={styles.emptyChatText}>
            Chat feature coming soon!{'\n'}For now, check the vibe 👇
          </Text>
        </View>
      </View>

      {/* Vibe Check section */}
      <View style={styles.vibeSection}>
        {bothChecked ? (
          <View style={styles.revealCard}>
            <Ionicons name="heart-circle" size={48} color="#22C55E" />
            <Text style={styles.revealTitle}>It's a match! 🎉</Text>
            <Text style={styles.revealSubtitle}>
              Both of you checked the vibe. Phone numbers revealed!
            </Text>
          </View>
        ) : (
          <VibeCheck
            matchId={match.id}
            isUserA={isUserA}
            checked={!!myChecked}
            theirChecked={!!theirChecked}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B8BA3',
    fontVariant: ['tabular-nums'],
  },
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyChat: {
    alignItems: 'center',
    gap: 16,
  },
  emptyChatText: {
    color: '#4A4A6A',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  vibeSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  revealCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  revealTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22C55E',
  },
  revealSubtitle: {
    fontSize: 14,
    color: '#8B8BA3',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
