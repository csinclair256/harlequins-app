import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  StatusBar, TouchableOpacity, Linking, RefreshControl, Alert
} from 'react-native';
import { Image, ImageErrorEventData } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, ExternalLink, Trophy, CalendarPlus } from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';
// R-01/R-02: Migrated from ../../supabase (untyped JS) to hardened supabaseClient.ts
import { supabase, supabaseFunctionsUrl, competitionImagesStorageUrl, Competition } from '../../supabaseClient';
// R-03: Image URL resolution extracted from renderItem inline IIFE
import { resolveImageUrl } from '../../utils/resolveImageUrl';
// R-05: Brand token system — replaces all inline hex literals
import { Theme } from '../../constants/theme';
// R-09: Priority keywords extracted to centralised config
import { PRIORITY_KEYWORDS } from '../../config/appConfig';

// R-10: startOfLocalDay ensures event_date ISO strings (parsed as UTC) are
// compared in local calendar time, preventing off-by-one in AEST/AEDT (UTC+10/11).
function startOfLocalDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

// R-10: Format ISO date string as 'DD MMM YYYY' (e.g. '20 APR 2026')
const MONTH_LABELS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'] as const;
function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00'); // force local-time parse
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

const TODAY = startOfLocalDay(new Date());

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
        <Trophy color={Theme.colors.iconPlaceholder} size={24} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.thumbnailImage}
      contentFit="cover"
      onLoadStart={() => console.log('Fetching image:', uri)}
      onError={({ error }: ImageErrorEventData) => {
        console.log('Image Error:', error);
        setFailed(true);
      }}
    />
  );
}

export default function HomeScreen() {
  // R-02: competitions typed as Competition[] — eliminates any[] debt
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // R-04: fetchCompetitions stable via useCallback([], []) — no closure dependencies
  const fetchCompetitions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setCompetitions(data ?? []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Fetch Error:', error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompetitions();
  }, [fetchCompetitions]);

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
          <ActivityIndicator size="large" color={Theme.colors.textWhite} />
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
              item.event_name?.includes(kw) ?? false
            );
            // R-10: parse event_date as local midnight to avoid UTC offset bug
            const daysRemaining = item.event_date
              ? Math.round((startOfLocalDay(new Date(item.event_date + 'T00:00:00')).getTime() - TODAY.getTime()) / 86400000)
              : null;

            // R-03: Replaced inline IIFE with resolveImageUrl utility
            const imageUri = resolveImageUrl(
              item.event_image_url,
              supabaseFunctionsUrl,
              competitionImagesStorageUrl,
            );

            const isPast = daysRemaining !== null && daysRemaining < 0;

            return (
              <View style={[styles.card, isPriority && styles.cardPriority]}>
                {isPriority && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>★ PRIORITY EVENT</Text>
                  </View>
                )}
                {/* R-10: CLOSED stamp — absolute overlay, pointer-events disabled */}
                {isPast && (
                  <View style={styles.closedStampOverlay} pointerEvents="none">
                    <View style={styles.closedStampInner}>
                      <Text style={styles.closedStampText}>CLOSED</Text>
                    </View>
                  </View>
                )}
                <View style={styles.thumbnailContainer}>
                  {imageUri ? (
                    <ThumbnailWithFallback uri={imageUri} />
                  ) : (
                    <View style={styles.placeholderIcon}>
                      <Trophy color={Theme.colors.iconPlaceholder} size={24} />
                    </View>
                  )}
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
                    <Calendar color={Theme.colors.textMuted} size={12} />
                    <Text style={styles.detailText}>
                      {item.event_date ? formatEventDate(item.event_date) : '—'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MapPin color={Theme.colors.textMuted} size={12} />
                    <Text style={styles.detailText}>{item.location}</Text>
                  </View>

                  <View style={styles.footer}>
                    {(() => {
                      return (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, isPast ? styles.actionBtnPast : styles.actionBtnFuture]}
                            onPress={() => item.web_address && Linking.openURL(item.web_address)}
                          >
                            <Text style={[styles.actionBtnText, isPast && styles.actionBtnTextPast]}>
                              {isPast ? 'Results' : 'Register'}
                            </Text>
                            <ExternalLink color={isPast ? Theme.colors.textDisabled : Theme.colors.textWhite} size={11} />
                          </TouchableOpacity>
                          {!isPast && (
                            <TouchableOpacity
                              style={styles.calendarBtn}
                              onPress={() => item.event_name && item.event_date &&
                                addToCalendar(item.event_name, item.event_date, item.web_address ?? undefined)}
                            >
                              <CalendarPlus color={Theme.colors.gold} size={16} />
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
  container: { flex: 1, backgroundColor: Theme.colors.backgroundDark },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
  },
  logo: { width: 270, height: 84, marginBottom: -5 },
  subtitle: { fontSize: 16, color: Theme.colors.textWhite, fontWeight: 'bold', marginTop: 0 },
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPriority: {
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    shadowColor: Theme.colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  priorityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.textOnGold,
    letterSpacing: 0.5,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Theme.colors.surfaceHighlight,
    overflow: 'hidden',
    marginRight: 15,
  },
  thumbnailImage: { width: '100%', height: '100%' },
  placeholderIcon: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1, justifyContent: 'space-between' },
  eventName: { fontSize: 16, fontWeight: '700', color: Theme.colors.textWhite, marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailText: { marginLeft: 4, fontSize: 12, color: Theme.colors.textMuted },
  countdown: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.gold,
    marginBottom: 4,
  },
  countdownToday: {
    color: Theme.colors.success,
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
  actionBtnFuture: { backgroundColor: Theme.colors.primary },
  actionBtnPast: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Theme.colors.borderMuted },
  actionBtnText: { fontWeight: '700', fontSize: 12, color: Theme.colors.textWhite },
  actionBtnTextPast: { color: Theme.colors.textDisabled },
  // R-10: CLOSED stamp
  closedStampOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closedStampInner: {
    borderWidth: 3,
    borderColor: Theme.colors.danger,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
    transform: [{ rotate: '-15deg' }],
  },
  closedStampText: {
    color: Theme.colors.danger,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
