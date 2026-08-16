import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/lib/supabase';
import { Message } from '../../src/lib/database.types';
import { BorderRadius, Colors, Spacing, Typography } from '../../src/constants/theme';

type Contact = { id: string; display_name: string; role: string };

export default function ConversationScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { initialized, user } = useAuthStore();
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const loadConversation = async () => {
    if (!user || !userId) return;
    const [{ data: profileRows }, { data, error }] = await Promise.all([
      supabase.rpc('get_public_profile', { profile_id: userId }),
      supabase.from('messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }),
    ]);
    if (error) throw error;
    setContact(profileRows?.[0] || null);
    setMessages((data || []) as Message[]);
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', userId)
      .eq('receiver_id', user.id)
      .is('read_at', null);
  };

  useEffect(() => {
    loadConversation().catch((error) =>
      Alert.alert('Conversation Error', error?.message || 'Unable to load messages.')
    );
  }, [user?.id, userId]);

  const sendMessage = async () => {
    const text = content.trim();
    if (!text || !user || !userId || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      content: text,
    }).select().single();
    setSending(false);
    if (error || !data) {
      Alert.alert('Message Failed', error?.message || 'Unable to send this message.');
      return;
    }
    setContent('');
    setMessages((current) => [...current, data as Message]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  if (!initialized) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.matteClay} /></View>;
  }
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.deepCocoa} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{contact?.display_name || 'Conversation'}</Text>
          {contact && <Text style={styles.subtitle}>{contact.role}</Text>}
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = item.sender_id === user.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.messageText, mine && { color: Colors.white }]}>{item.content}</Text>
              <Text style={[styles.time, mine && { color: Colors.warmAlmond }]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Start the conversation with a clear question.</Text>}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Write a message..."
          placeholderTextColor={Colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity style={styles.send} onPress={sendMessage} disabled={sending || !content.trim()}>
          {sending ? <ActivityIndicator color={Colors.white} /> : <Ionicons name="send" size={19} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.softCream },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.caption, color: Colors.textSecondary, textTransform: 'capitalize' },
  list: { flexGrow: 1, padding: Spacing.md, gap: Spacing.sm, justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', padding: Spacing.sm, borderRadius: BorderRadius.lg },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.matteClay, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  messageText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, lineHeight: 20 },
  time: { fontSize: Typography.tiny, color: Colors.textTertiary, alignSelf: 'flex-end', marginTop: 3 },
  empty: { textAlign: 'center', color: Colors.textSecondary, margin: Spacing.xl },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.white },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.softCream, color: Colors.deepCocoa },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.matteClay },
});
