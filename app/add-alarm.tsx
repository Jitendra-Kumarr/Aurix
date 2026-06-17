import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { createAlarm, loadAlarms, saveAlarms } from '../constants/alarmStore';

export default function AddAlarmScreen() {
  const router = useRouter();
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('');
  const [isAM, setIsAM] = useState(true);

  const incrementHour = () => setHour(h => (h % 12) + 1);
  const decrementHour = () => setHour(h => h === 1 ? 12 : h - 1);
  const incrementMinute = () => setMinute(m => (m + 1) % 60);
  const decrementMinute = () => setMinute(m => m === 0 ? 59 : m - 1);

  const saveAlarm = async () => {
    const actualHour = isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const alarm = createAlarm(actualHour, minute, label || 'Alarm');
    const existing = await loadAlarms();
    await saveAlarms([...existing, alarm]);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set Alarm</Text>

        {/* Time Picker */}
        <View style={styles.timePicker}>
          {/* Hour */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={incrementHour} style={styles.spinBtn}>
              <Text style={styles.spinArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDigit}>{hour.toString().padStart(2, '0')}</Text>
            <TouchableOpacity onPress={decrementHour} style={styles.spinBtn}>
              <Text style={styles.spinArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.colon}>:</Text>

          {/* Minute */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={incrementMinute} style={styles.spinBtn}>
              <Text style={styles.spinArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDigit}>{minute.toString().padStart(2, '0')}</Text>
            <TouchableOpacity onPress={decrementMinute} style={styles.spinBtn}>
              <Text style={styles.spinArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* AM/PM */}
          <View style={styles.ampmCol}>
            <TouchableOpacity
              style={[styles.ampmBtn, isAM && styles.ampmActive]}
              onPress={() => setIsAM(true)}
            >
              <Text style={[styles.ampmText, isAM && styles.ampmTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ampmBtn, !isAM && styles.ampmActive]}
              onPress={() => setIsAM(false)}
            >
              <Text style={[styles.ampmText, !isAM && styles.ampmTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Label */}
        <Text style={styles.sectionLabel}>Label</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning Alarm"
          placeholderTextColor="#C7C7CC"
          value={label}
          onChangeText={setLabel}
          maxLength={30}
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveAlarm}>
          <Text style={styles.saveBtnText}>Save Alarm</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 32, textAlign: 'center' },
  timePicker: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  spinnerCol: { alignItems: 'center', marginHorizontal: 8 },
  spinBtn: { padding: 12 },
  spinArrow: { color: '#FF6B00', fontSize: 20 },
  timeDigit: { color: '#1C1C1E', fontSize: 52, fontWeight: 'bold', minWidth: 70, textAlign: 'center' },
  colon: { color: '#1C1C1E', fontSize: 52, fontWeight: 'bold', marginBottom: 8 },
  ampmCol: { marginLeft: 16, gap: 8 },
  ampmBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  ampmActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  ampmText: { color: '#8E8E93', fontWeight: 'bold' },
  ampmTextActive: { color: 'white' },
  sectionLabel: {
    color: '#8E8E93', fontSize: 13, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    color: '#1C1C1E', fontSize: 16, borderWidth: 1, borderColor: '#E5E5EA',
    marginBottom: 32,
  },
  saveBtn: {
    backgroundColor: '#1C1C1E', borderRadius: 20, padding: 18, alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
});