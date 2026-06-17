import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Vibration, ScrollView, Dimensions, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HOUSEHOLD_ITEMS } from '../constants/items';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.4;
const ITEM_SPACING = 16;

export default function RingingScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<'spinning' | 'mission' | 'camera' | 'analyzing' | 'success'>('spinning');
  const [selectedItem, setSelectedItem] = useState(HOUSEHOLD_ITEMS[0]);
  const [analysisText, setAnalysisText] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const cameraRef = useRef<CameraView>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const vibInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const startAlarm = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/alarm.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.log('Audio error:', e);
      }
      vibInterval.current = setInterval(() => {
        Vibration.vibrate([400, 400]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 900);
    };
    startAlarm();
    startTimeRef.current = Date.now();
    return () => {
      if (vibInterval.current) clearInterval(vibInterval.current);
      Vibration.cancel();
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'spinning') return;
    const itemCount = HOUSEHOLD_ITEMS.length;
    const randomIndex = Math.floor(Math.random() * itemCount);
    const totalScroll = itemCount * 3 + randomIndex;
    const targetX = totalScroll * (ITEM_WIDTH + ITEM_SPACING);
    Animated.timing(spinAnim, {
      toValue: targetX,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setSelectedItem(HOUSEHOLD_ITEMS[randomIndex]);
      setPhase('mission');
      startPulse();
    });
    spinAnim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ x: value, animated: false });
    });
    return () => spinAnim.removeAllListeners();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'success') return;
    confettiAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + i * 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [phase]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopAlarm = async () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(elapsed);
    if (vibInterval.current) clearInterval(vibInterval.current);
    Vibration.cancel();
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
  };

  const startMission = async () => {
    if (!permission?.granted) await requestPermission();
    setPhase('camera');
  };

  const takePicture = async () => {
    setPhase('analyzing');
    setAnalysisText(`Analyzing ${selectedItem.name}...`);
    setTimeout(() => {
      setPhase('success');
      stopAlarm();
    }, 2000);
  };

  // SPINNING PHASE
  if (phase === 'spinning') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.appName}>Aurix</Text>
        <Text style={styles.title}>⏰ Wake Up!</Text>
        <Text style={styles.subtitle}>Finding your mission...</Text>
        <View style={styles.wheelContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wheelContent}
          >
            {[...HOUSEHOLD_ITEMS, ...HOUSEHOLD_ITEMS, ...HOUSEHOLD_ITEMS, ...HOUSEHOLD_ITEMS].map((item, i) => (
              <View key={i} style={styles.wheelItem}>
                <Text style={styles.wheelEmoji}>{item.emoji}</Text>
                <Text style={styles.wheelName}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.wheelIndicatorLeft} />
          <View style={styles.wheelIndicatorRight} />
        </View>
      </SafeAreaView>
    );
  }

  // MISSION PHASE
  if (phase === 'mission') {
    return (
      <SafeAreaView style={styles.missionContainer}>
        <View style={styles.missionTop}>
          <Text style={styles.sunEmoji}>☀️</Text>
          <Text style={styles.title}>Time to Wake Up!</Text>
          <Text style={styles.subtitle}>Object Hunt to turn off your alarm</Text>
        </View>

        <Animated.View style={[styles.itemCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.itemEmoji}>{selectedItem.emoji}</Text>
          <Text style={styles.itemName}>{selectedItem.name}</Text>
        </Animated.View>

        <TouchableOpacity style={styles.smallPillBtn} onPress={startMission}>
          <Text style={styles.smallPillBtnText}>Start Mission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // CAMERA PHASE
  if (phase === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <SafeAreaView>
          <Text style={styles.appNameDark}>Aurix</Text>
        </SafeAreaView>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.detectionBox} />
            <Text style={styles.cameraHint}>
              {selectedItem.emoji} {selectedItem.name}
            </Text>
          </View>
        </CameraView>
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    );
  }

  // ANALYZING PHASE
  if (phase === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.appName}>Aurix</Text>
        <Text style={styles.analyzingEmoji}>🔍</Text>
        <Text style={styles.analyzingText}>{analysisText}</Text>
      </SafeAreaView>
    );
  }

  // SUCCESS PHASE
  return (
    <SafeAreaView style={styles.successContainer}>
      <View style={styles.confettiRow}>
        {['🎊', '🎉', '✨', '⭐', '🌟', '💫', '🎈', '🥳'].map((c, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.confetti,
              {
                left: (i * width) / 8,
                transform: [
                  {
                    translateY: confettiAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 160],
                    })
                  },
                  {
                    rotate: confettiAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${i % 2 === 0 ? 360 : -360}deg`],
                    })
                  },
                  {
                    scale: confettiAnims[i].interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.4, 0.5],
                    })
                  }
                ],
                opacity: confettiAnims[i].interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [1, 1, 0],
                }),
              }
            ]}
          >
            {c}
          </Animated.Text>
        ))}
      </View>

      <Text> <Text style={{ fontWeight: 'bold',  fontSize: 32  }}>Good Morning! 🌻</Text> </Text>
      <Text style={styles.successSun}>☀️</Text>

      <View style={styles.successBadge}>
        <Text style={styles.successBadgeText}>Alarm turned off!</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔵</Text>
          <Text style={styles.statValue}>{timeTaken}s</Text>
          <Text style={styles.statLabel}>Time Taken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏅</Text>
          <Text style={styles.statValue}>14</Text>
          <Text style={styles.statLabel}>Next Badge</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.smallPillBtn} onPress={() => router.replace('/' as any)}>
        <Text style={styles.smallPillBtnText}>Start My Day</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  missionContainer: {
    flex: 1, backgroundColor: '#F2F2F7',
    alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48,
  },
  missionTop: { alignItems: 'center' },
  successContainer: {
    flex: 1, backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
  appNameDark: { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 8, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  sunEmoji: { fontSize: 56, marginBottom: 10 },

  // Wheel
  wheelContainer: { width: '100%', height: 140, justifyContent: 'center', marginTop: 32 },
  wheelContent: { paddingHorizontal: width / 2 - ITEM_WIDTH / 2, alignItems: 'center' },
  wheelItem: {
    width: ITEM_WIDTH, marginHorizontal: ITEM_SPACING / 2,
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    padding: 16, borderWidth: 1, borderColor: '#E5E5EA',
  },
  wheelEmoji: { fontSize: 36, marginBottom: 4 },
  wheelName: { color: '#1C1C1E', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  wheelIndicatorLeft: { position: 'absolute', left: width / 2 - ITEM_WIDTH / 2 - 2, top: 0, bottom: 0, width: 2, backgroundColor: '#FF6B00', borderRadius: 2 },
  wheelIndicatorRight: { position: 'absolute', left: width / 2 + ITEM_WIDTH / 2, top: 0, bottom: 0, width: 2, backgroundColor: '#FF6B00', borderRadius: 2 },

  // Item card
  itemCard: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 80,
  },
  itemEmoji: { fontSize: 130, marginBottom: 12 },
  itemName: { fontSize: 30, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 0 },

  // Buttons
  smallPillBtn: {
    backgroundColor: '#1C1C1E', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 52,
    alignItems: 'center',
  },
  smallPillBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: 'black', alignItems: 'center' },
  camera: { width: '100%', flex: 1 },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detectionBox: { width: 220, height: 220, borderWidth: 2, borderColor: 'white', borderRadius: 20 },
  cameraHint: {
    color: 'white', fontSize: 18, fontWeight: '600', marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10,
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', margin: 24,
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1C1C1E' },

  // Analyzing
  analyzingEmoji: { fontSize: 64, marginBottom: 16 },
  analyzingText: { color: '#1C1C1E', fontSize: 18, fontWeight: '600', textAlign: 'center' },

  // Success
  confettiRow: { position: 'absolute', top: 60, width: '100%', height: 160, overflow: 'hidden' },
  confetti: { position: 'absolute', fontSize: 22, top: 0 },
  successSun: { fontSize: 80, marginBottom: 16 },
  successBadge: {
    borderWidth: 2, borderColor: '#FF6B00', borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 12, marginBottom: 24,
  },
  successBadgeText: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  statCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 12,
    alignItems: 'center', width: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  statLabel: { fontSize: 10, color: '#8E8E93', textAlign: 'center', marginTop: 2 },
});