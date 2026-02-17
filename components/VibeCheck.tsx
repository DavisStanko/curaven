import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type VibeCheckProps = {
  matchId: string;
  isUserA: boolean;
  checked: boolean;
  theirChecked: boolean;
};

export function VibeCheck({ matchId, isUserA, checked, theirChecked }: VibeCheckProps) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);

    const column = isUserA ? 'user_a_checked' : 'user_b_checked';
    const newValue = !checked;

    const { error } = await supabase
      .from('matches')
      .update({ [column]: newValue })
      .eq('id', matchId);

    if (error) {
      Alert.alert('Error', 'Could not update vibe check.');
    }

    setToggling(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>The Vibe Check</Text>
      <Text style={styles.hint}>
        {checked
          ? 'You checked the vibe! Waiting for your match…'
          : 'If BOTH of you check it, phone numbers are revealed.'}
      </Text>

      <TouchableOpacity
        style={[
          styles.checkArea,
          checked && styles.checkAreaActive,
        ]}
        onPress={handleToggle}
        disabled={toggling}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxActive]}>
          {checked && <Ionicons name="checkmark" size={28} color="#fff" />}
        </View>
        <Text style={[styles.checkText, checked && styles.checkTextActive]}>
          {checked ? 'Vibes checked ✓' : 'Check the vibe'}
        </Text>
      </TouchableOpacity>

      {/* Status of the other user */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            theirChecked ? styles.statusDotActive : styles.statusDotInactive,
          ]}
        />
        <Text style={styles.statusText}>
          {theirChecked ? 'Your match checked the vibe!' : "Your match hasn't checked yet"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#8B8BA3',
    textAlign: 'center',
    lineHeight: 18,
  },
  checkArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#2A2A40',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 14,
  },
  checkAreaActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: '#A855F7',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4A4A6A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
  },
  checkText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8B8BA3',
  },
  checkTextActive: {
    color: '#A855F7',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusDotInactive: {
    backgroundColor: '#4A4A6A',
  },
  statusText: {
    fontSize: 13,
    color: '#8B8BA3',
  },
});
