import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator, 
  StatusBar, TouchableOpacity, Linking, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, ExternalLink, Trophy } from 'lucide-react-native';
// This import jumps up two levels to find your supabase.js config
import { supabase, supabaseFunctionsUrl, competitionImagesStorageUrl } from '../../supabase';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

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
        <View>
          <Text style={styles.title}>Harlequins BJJ</Text>
          <Text style={styles.subtitle}>2026 Competition Schedule</Text>
        </View>
        <Trophy color="#FFFFFF" size={28} />
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
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.card}
              onPress={() => item.web_address && Linking.openURL(item.web_address)}
            >
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
                    const isPast = item.event_date && new Date(item.event_date) < TODAY;
                    return (
                      <View style={[styles.actionBtn, isPast ? styles.actionBtnPast : styles.actionBtnFuture]}>
                        <Text style={[styles.actionBtnText, isPast && styles.actionBtnTextPast]}>
                          {isPast ? 'Results' : 'Register'}
                        </Text>
                        <ExternalLink color={isPast ? '#666666' : '#FFFFFF'} size={11} />
                      </View>
                    );
                  })()}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C'
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#AAAAAA', fontWeight: '500', marginTop: 2 },
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
  footer: {
    alignSelf: 'flex-end',
    marginTop: 5
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