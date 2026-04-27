import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  TouchableOpacity, Linking, RefreshControl, Alert
} from 'react-native';
import { Image, ImageErrorEventData } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, ExternalLink, Trophy, CalendarPlus } from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';
import { supabase, supabaseFunctionsUrl, competitionImagesStorageUrl, Competition } from '../../supabaseClient';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { PRIORITY_KEYWORDS } from '../../config/appConfig';
import { FeedbackButton } from '../../components/FeedbackButton';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemeColors } from '../../constants/theme';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfLocalDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

const MONTH_LABELS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'] as const;
function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

const TODAY = startOfLocalDay(new Date());

// ─── Registration phase logic ─────────────────────────────────────────────────

interface RegPhase {
  label: string;
  closes: string;
  price: number;
  note?: string;
}

function resolveRegistrationPhase(
  feesJson: string | null
): { phase: RegPhase | null; hasPhases: boolean } {
  if (!feesJson) return { phase: null, hasPhases: false };
  try {
    const parsed = JSON.parse(feesJson);
    if (!Array.isArray(parsed?.phases)) return { phase: null, hasPhases: false };
    const phase = (parsed.phases as RegPhase[]).find(p => {
      const closeDate = startOfLocalDay(new Date(p.closes + 'T00:00:00'));
      return TODAY.getTime() <= closeDate.getTime();
    }) ?? null;
    return { phase, hasPhases: true };
  } catch {
    return { phase: null, hasPhases: false };
  }
}

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

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function ThumbnailWithFallback({ uri, colors }: { uri: string; colors: ThemeColors }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={thumbStyles.placeholder}>
        <Trophy color={colors.iconPlaceholder} size={24} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={thumbStyles.image}
      contentFit="cover"
      onLoadStart={() => console.log('Fetching image:', uri)}
      onError={({ error }: ImageErrorEventData) => {
        console.log('Image Error:', error);
        setFailed(true);
      }}
    />
  );
}

const thumbStyles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setFetchError(false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('event_date', { ascending: true })
        .abortSignal(controller.signal);
      clearTimeout(timeoutId);
      if (error) throw error;
      setCompetitions(data ?? []);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) console.error('Fetch Error:', err.message);
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCompetitions(); }, [fetchCompetitions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompetitions();
  }, [fetchCompetitions]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.subtitleRow}>
          <Image
            source={require('../../assets/anvil-icon.png')}
            style={styles.anvilIcon}
            contentFit="contain"
            tintColor={colors.textWhite}
          />
          <Text style={styles.subtitle}>2026 EVENTS SCHEDULE</Text>
          <Image
            source={require('../../assets/anvil-icon.png')}
            style={styles.anvilIcon}
            contentFit="contain"
            tintColor={colors.textWhite}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textWhite} />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Unable to load competitions.{'\n'}Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchCompetitions(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isPriority = PRIORITY_KEYWORDS.some(kw => item.event_name?.includes(kw) ?? false);
            const daysRemaining = item.event_date
              ? Math.round((startOfLocalDay(new Date(item.event_date + 'T00:00:00')).getTime() - TODAY.getTime()) / 86400000)
              : null;
            const imageUri = resolveImageUrl(item.event_image_url, supabaseFunctionsUrl, competitionImagesStorageUrl);
            const isPast = daysRemaining !== null && daysRemaining < 0;
            const isGrading = item.event_name?.includes('Grading') ?? false;
            const { phase: currentPhase, hasPhases } = resolveRegistrationPhase(item.registration_fees);
            const regClosed = !isPast && hasPhases && currentPhase === null;

            return (
              <View style={[styles.card, isGrading ? styles.cardGrading : isPriority && styles.cardPriority]}>
                {isGrading && !isPast && (
                  <View style={styles.inviteBadge}>
                    <Text style={styles.inviteBadgeText}>INVITATION ONLY</Text>
                  </View>
                )}
                {!isGrading && isPriority && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>★ PRIORITY EVENT</Text>
                  </View>
                )}
                {isPast && (
                  <View style={styles.closedStampOverlay} pointerEvents="none">
                    <View style={styles.closedStampInner}>
                      <Text style={styles.closedStampText}>CLOSED</Text>
                    </View>
                  </View>
                )}
                <View style={styles.thumbnailContainer}>
                  {imageUri ? (
                    <ThumbnailWithFallback uri={imageUri} colors={colors} />
                  ) : (
                    <View style={thumbStyles.placeholder}>
                      <Trophy color={colors.iconPlaceholder} size={24} />
                    </View>
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.eventName} numberOfLines={2}>{item.event_name}</Text>

                  {daysRemaining !== null && daysRemaining >= 0 && (
                    <Text style={[styles.countdown, daysRemaining === 0 && styles.countdownToday]}>
                      {daysRemaining === 0 ? '🏆 COMPETITION DAY' : `⏳ ${daysRemaining} Days to Go`}
                    </Text>
                  )}

                  <View style={styles.detailRow}>
                    <Calendar color={colors.textMuted} size={12} />
                    <Text style={styles.detailText}>
                      {item.event_date ? formatEventDate(item.event_date) : '—'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MapPin color={colors.textMuted} size={12} />
                    <Text style={styles.detailText}>{item.location}</Text>
                  </View>

                  {!isPast && currentPhase && (
                    <View style={styles.phaseRow}>
                      <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
                      <Text style={styles.phaseSep}>·</Text>
                      <Text style={styles.phasePrice}>${currentPhase.price}</Text>
                    </View>
                  )}

                  <View style={styles.footer}>
                    {isPast ? (
                      <FeedbackButton
                        style={[styles.actionBtn, styles.actionBtnPast]}
                        onPress={() => item.web_address && Linking.openURL(item.web_address)}
                        disabled={!item.web_address}
                      >
                        <Text style={[styles.actionBtnText, styles.actionBtnTextPast]}>Results</Text>
                        <ExternalLink color={colors.textDisabled} size={11} />
                      </FeedbackButton>
                    ) : regClosed ? (
                      <Text style={styles.regClosedText}>REG CLOSED</Text>
                    ) : (
                      <FeedbackButton
                        style={[styles.actionBtn, styles.actionBtnFuture]}
                        onPress={() => item.web_address && Linking.openURL(item.web_address)}
                        disabled={!item.web_address}
                      >
                        <Text style={styles.actionBtnText}>Register</Text>
                        <ExternalLink color="#FFFFFF" size={11} />
                      </FeedbackButton>
                    )}
                    {!isPast && (
                      <FeedbackButton
                        style={styles.calendarBtn}
                        onPress={() => item.event_name && item.event_date &&
                          addToCalendar(item.event_name, item.event_date, item.web_address ?? undefined)}
                      >
                        <CalendarPlus color={colors.gold} size={16} />
                      </FeedbackButton>
                    )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.backgroundDark },
    header: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    logo: { width: 320, height: 53, marginBottom: 4 },
    subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -6 },
    anvilIcon: { width: 28, height: 14 },
    subtitle: { fontSize: 20, fontWeight: '700', color: c.textWhite },
    listContainer: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      flexDirection: 'row',
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    cardPriority: {
      borderWidth: 1,
      borderColor: c.gold,
      shadowColor: c.goldDark,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    cardGrading: {
      borderWidth: 1,
      borderColor: c.danger,
      shadowColor: c.danger,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    priorityBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: c.gold,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 8,
    },
    priorityBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: c.textOnGold,
      letterSpacing: 0.5,
    },
    inviteBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: c.danger,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 8,
    },
    inviteBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    thumbnailContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: c.surfaceHighlight,
      overflow: 'hidden',
      marginRight: 15,
    },
    infoContainer: { flex: 1, justifyContent: 'space-between' },
    eventName: { fontSize: 16, fontWeight: '700', color: c.textWhite, marginBottom: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    detailText: { marginLeft: 4, fontSize: 12, color: c.textMuted },
    countdown: {
      fontSize: 12,
      fontWeight: '700',
      color: c.goldLight,
      marginBottom: 4,
    },
    countdownToday: {
      color: c.success,
      fontSize: 13,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginTop: 5,
      gap: 8,
    },
    calendarBtn: { padding: 4 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 5,
    },
    actionBtnFuture: { backgroundColor: c.primary },
    actionBtnPast: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.borderMuted },
    actionBtnText: { fontWeight: '700', fontSize: 12, color: '#FFFFFF' },
    actionBtnTextPast: { color: c.textDisabled },
    phaseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    phaseLabel: { fontSize: 11, fontWeight: '700', color: c.goldLight, letterSpacing: 0.5 },
    phaseSep: { fontSize: 11, color: c.textMuted },
    phasePrice: { fontSize: 11, fontWeight: '800', color: c.goldLight },
    regClosedText: { fontSize: 11, fontWeight: '800', color: c.textMuted, letterSpacing: 1 },
    errorText: { color: c.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 16 },
    retryBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    closedStampOverlay: {
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closedStampInner: {
      borderWidth: 3,
      borderColor: c.danger,
      borderRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 5,
      transform: [{ rotate: '-15deg' }],
    },
    closedStampText: {
      color: c.danger,
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
  });
}
