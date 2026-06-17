import AsyncStorage from '@react-native-async-storage/async-storage';

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
};

const KEY = 'aurix_alarms';

export const saveAlarms = async (alarms: Alarm[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(alarms));
};

export const loadAlarms = async (): Promise<Alarm[]> => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const createAlarm = (hour: number, minute: number, label = 'Alarm'): Alarm => ({
  id: Date.now().toString(),
  hour,
  minute,
  label,
  enabled: true,
});