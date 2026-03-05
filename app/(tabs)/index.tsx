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
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Harlequins BJJ</Text>
          <Text style={styles.subtitle}>2026 Competition Schedule</Text>
        </View>
        <Trophy color="#000" size={28} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
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
                  const storagePath = item.event_image_storage_path;
                  const remoteUrl = item.event_image_url;
                  const storagePathPrefix = '/storage/v1/object/public/competition-images/';
                  const isStorageUrl = remoteUrl && remoteUrl.includes(storagePathPrefix);
                  const imageUri = storagePath
                    ? `${competitionImagesStorageUrl}/${storagePath}`
                    : isStorageUrl
                      ? `${competitionImagesStorageUrl}/${remoteUrl.split(storagePathPrefix)[1] || ''}`
                      : remoteUrl
                        ? `${supabaseFunctionsUrl}/proxy-image?url=${encodeURIComponent(remoteUrl)}`
                        : '';
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
                  <Calendar color="#8E8E93" size={12} />
                  <Text style={styles.detailText}>{item.event_date}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MapPin color="#8E8E93" size={12} />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.registerBtn}>Register</Text>
                  <ExternalLink color="#007AFF" size={12} />
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  title: { fontSize: 26, fontWeight: '800', color: '#000' },
  subtitle: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    flexDirection: 'row',
    padding: 12, 
    marginBottom: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2
  },
  thumbnailContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    backgroundColor: '#F2F2F7', 
    overflow: 'hidden', 
    marginRight: 15 
  },
  thumbnailImage: { width: '100%', height: '100%' },
  placeholderIcon: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1, justifyContent: 'space-between' },
  eventName: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailText: { marginLeft: 4, fontSize: 12, color: '#8E8E93' },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-end', 
    marginTop: 5 
  },
  registerBtn: { color: '#007AFF', fontWeight: '700', fontSize: 12, marginRight: 4 }
});