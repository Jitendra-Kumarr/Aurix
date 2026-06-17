import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Switch, Alert, SafeAreaView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { loadAlarms, saveAlarms, Alarm } from '../constants/alarmStore';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HomeScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [streak, setStreak] = useState(7);
  const router = useRouter();
  const today = new Date().getDay();

  useFocusEffect(
    useCallback(() => {
      loadAlarms().then(setAlarms);
    }, [])
  );

  useEffect(() => {
    const check = () => {
      const now = new Date();
      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.hour === now.getHours() && alarm.minute === now.getMinutes()) {
          router.push('/ringing' as any);
        }
      });
    };
    const interval = setInterval(check, 30000);
    check();
    return () => clearInterval(interval);
  }, [alarms]);

  const toggleAlarm = async (id: string) => {
    const updated = alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlarms(updated);
    await saveAlarms(updated);
  };

  const deleteAlarm = async (id: string) => {
    Alert.alert('Delete Alarm', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = alarms.filter(a => a.id !== id);
          setAlarms(updated);
          await saveAlarms(updated);
        }
      }
    ]);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour < 12 ? 'AM' : 'PM';
    return { time: `${h}:${m}`, ampm };
  };

  const getTimeUntil = (hour: number, minute: number) => {
    const now = new Date();
    const alarm = new Date();
    alarm.setHours(hour, minute, 0, 0);
    if (alarm <= now) alarm.setDate(alarm.getDate() + 1);
    const diff = alarm.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `Rings in ${h}h ${m}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>☀️ Aurix</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {DAYS.map((day, i) => (
          <View key={i} style={styles.dayCol}>
            <Text style={styles.dayLabel}>{day}</Text>
            <View style={[styles.dayCircle, i < today && styles.dayDone]}>
              {i < today ? (
                <Text style={styles.dayCheck}>✓</Text>
              ) : (
                <Text style={[styles.dayNum, i === today && styles.dayNumToday]}>{i + 15}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Alarms */}
      {alarms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⏰</Text>
          <Text style={styles.emptyText}>No alarms yet</Text>
          <Text style={styles.emptySubText}>Tap + to add your first alarm</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const { time, ampm } = formatTime(item.hour, item.minute);
            return (
              <TouchableOpacity
                style={styles.alarmCard}
                onLongPress={() => deleteAlarm(item.id)}
              >
                <View>
                  <Text style={styles.alarmLabel}>
                    {item.hour < 12 ? 'Tomorrow morning' : 'Tomorrow'}
                  </Text>
                  <View style={styles.alarmTimeRow}>
                    <Text style={styles.alarmTime}>{time}</Text>
                    <Text style={styles.alarmAmpm}> {ampm}</Text>
                  </View>
                  <View style={styles.alarmMeta}>
                    <Text style={styles.alarmUntil}>⏱ {getTimeUntil(item.hour, item.minute)}</Text>
                  </View>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleAlarm(item.id)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="white"
                />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Mission Card */}
      <View style={styles.missionRow}>
        <View style={styles.missionCard}>
          <Text style={styles.missionCardTitle}>Object Hunt</Text>
          <Text style={styles.missionCardSub}>Mission</Text>
          <Text style={styles.missionCardIcon}>🎯</Text>
        </View>
        <View style={styles.missionCard}>
          <Text style={styles.missionCardTitle}>Default</Text>
          <Text style={styles.missionCardSub}>Sound</Text>
          <Text style={styles.missionCardIcon}>🔔</Text>
        </View>
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={styles.testBtn}
        onPress={() => router.push('/ringing' as any)}
      >
        <Text style={styles.testBtnText}>🔔 Test Alarm</Text>
      </TouchableOpacity>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-alarm' as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  streakBadge: { backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontSize: 15, fontWeight: '600', color: '#FF6B00' },

  // Week strip
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white', marginHorizontal: 16, borderRadius: 16, marginBottom: 16 },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  dayCheck: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  dayNum: { fontSize: 13, color: '#1C1C1E' },
  dayNumToday: { fontWeight: 'bold', color: '#FF6B00' },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: '#1C1C1E', fontSize: 22, fontWeight: 'bold' },
  emptySubText: { color: '#8E8E93', fontSize: 14, marginTop: 8 },

  // Alarm card
  alarmCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  alarmLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  alarmTimeRow: { flexDirection: 'row', alignItems: 'baseline' },
  alarmTime: { fontSize: 48, fontWeight: 'bold', color: '#1C1C1E' },
  alarmAmpm: { fontSize: 20, color: '#8E8E93', fontWeight: '500' },
  alarmMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  alarmUntil: { fontSize: 13, color: '#8E8E93' },

  // Mission cards
  missionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  missionCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  missionCardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  missionCardSub: { fontSize: 12, color: '#8E8E93', marginBottom: 12 },
  missionCardIcon: { fontSize: 28, alignSelf: 'flex-end' },

  // Test button
  testBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'white', borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  testBtnText: { color: '#FF6B00', fontSize: 16, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    backgroundColor: '#1C1C1E', width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 28, lineHeight: 32 },
});