import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  StatusBar, TouchableOpacity, Linking, RefreshControl, Alert
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, ExternalLink, Trophy, CalendarPlus } from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';
// This import jumps up two levels to find your supabase.js config
import { supabase, supabaseFunctionsUrl, competitionImagesStorageUrl } from '../../supabase';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const PRIORITY_KEYWORDS = ['ADCC Oceania', 'QJC States', 'Australian National', 'Pan Pac'];

async function addToCalendar(eventName: string, eventDate: string, webAddress?: string) {
  const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Calendar access is required to add events.');
    return;
  }
  const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
  const defaultCalendar =
    calendars.find(c => c.allowsModifications && c.isPrimary) ??
    calendars.find(c => c.allowsModifications);
  if (!defaultCalendar) {
    Alert.alert('No Calendar', 'No writable calendar found on this device.');
    return;
  }
  const start = new Date(eventDate);
  start.setHours(8, 0, 0, 0);
  const end = new Date(eventDate);
  end.setHours(20, 0, 0, 0);
  await ExpoCalendar.createEventAsync(defaultCalendar.id, {
    title: eventName,
    startDate: start,
    endDate: end,
    notes: webAddress ?? '',
    allDay: false,
  });
  Alert.alert('Added!', `"${eventName}" has been added to your calendar.`);
}

function ThumbnailWithFallback({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={styles.placeholderIcon}>
        <Trophy color="#CCC" size={24} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.thumbnailImage}
      contentFit="cover"
      onLoadStart={() => console.log('Fetching image from Mac:', uri)}
      onError={(e: any) => {
        console.log('Image Error:', e?.nativeEvent?.error ?? e?.message ?? e);
        setFailed(true);
      }}
    />
  );
}

export default function HomeScreen() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompetitions();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.subtitle}>2026 Competition Schedule</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const isPriority = PRIORITY_KEYWORDS.some(kw =>
              item.event_name?.includes(kw)
            );
            const daysRemaining = item.event_date
              ? Math.ceil((new Date(item.event_date).getTime() - TODAY.getTime()) / 86400000)
              : null;
            return (
            <View style={[styles.card, isPriority && styles.cardPriority]}>
              {isPriority && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>★ PRIORITY EVENT</Text>
                </View>
              )}
              <View style={styles.thumbnailContainer}>
                {(() => {
                  const rawUrl = item.event_image_url;
                  const imageUri = !rawUrl
                    ? ''
                    : !rawUrl.startsWith('http')
                      ? `${competitionImagesStorageUrl}/${rawUrl}`
                      : rawUrl.includes('/storage/v1/object/public/')
                        ? rawUrl
                        : `${supabaseFunctionsUrl}/proxy-image?url=${encodeURIComponent(rawUrl)}`;
                  return imageUri ? (
                    <ThumbnailWithFallback uri={imageUri} />
                  ) : (
                    <View style={styles.placeholderIcon}>
                      <Trophy color="#CCC" size={24} />
                    </View>
                  );
                })()}
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.eventName} numberOfLines={2}>
                  {item.event_name}
                </Text>

                {daysRemaining !== null && daysRemaining >= 0 && (
                  <Text style={[styles.countdown, daysRemaining === 0 && styles.countdownToday]}>
                    {daysRemaining === 0 ? '🏆 COMPETITION DAY' : `⏳ ${daysRemaining} Days to Go`}
                  </Text>
                )}

                <View style={styles.detailRow}>
                  <Calendar color="#AAAAAA" size={12} />
                  <Text style={styles.detailText}>{item.event_date}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MapPin color="#AAAAAA" size={12} />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>

                <View style={styles.footer}>
                  {(() => {
                    const isPast = daysRemaining !== null && daysRemaining < 0;
                    return (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, isPast ? styles.actionBtnPast : styles.actionBtnFuture]}
                          onPress={() => item.web_address && Linking.openURL(item.web_address)}
                        >
                          <Text style={[styles.actionBtnText, isPast && styles.actionBtnTextPast]}>
                            {isPast ? 'Results' : 'Register'}
                          </Text>
                          <ExternalLink color={isPast ? '#666666' : '#FFFFFF'} size={11} />
                        </TouchableOpacity>
                        {!isPast && (
                          <TouchableOpacity
                            style={styles.calendarBtn}
                            onPress={() => addToCalendar(item.event_name, item.event_date, item.web_address)}
                          >
                            <CalendarPlus color="#FFD700" size={16} />
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
            </View>
            );
          }}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C'
  },
  logo: { width: 270, height: 84, marginBottom: -5 },
  subtitle: { fontSize: 16, color: '#FFFFFF', fontWeight: 'bold', marginTop: 0 },
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  cardPriority: {
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  priorityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#121212',
    letterSpacing: 0.5,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2C2C2C',
    overflow: 'hidden',
    marginRight: 15
  },
  thumbnailImage: { width: '100%', height: '100%' },
  placeholderIcon: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1, justifyContent: 'space-between' },
  eventName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailText: { marginLeft: 4, fontSize: 12, color: '#AAAAAA' },
  countdown: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  countdownToday: {
    color: '#00E676',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 5,
    gap: 8,
  },
  calendarBtn: {
    padding: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  actionBtnFuture: { backgroundColor: '#2979FF' },
  actionBtnPast: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444444' },
  actionBtnText: { fontWeight: '700', fontSize: 12, color: '#FFFFFF' },
  actionBtnTextPast: { color: '#666666' },
});