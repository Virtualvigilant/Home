import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  role: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Amina Hassan',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'I found a great 2-bed in Kileleshwa for you!',
    time: '2m ago',
    unread: 2,
    role: 'Hunter',
  },
  {
    id: '2',
    name: 'Swift Movers KE',
    avatar: 'https://i.pravatar.cc/150?img=52',
    lastMessage: 'We can schedule the move for Saturday. Does that work?',
    time: '1h ago',
    unread: 0,
    role: 'Mover',
  },
  {
    id: '3',
    name: 'Furnicraft Kenya',
    avatar: 'https://i.pravatar.cc/150?img=60',
    lastMessage: 'Your sofa set order has been confirmed ✓',
    time: '3h ago',
    unread: 1,
    role: 'Retailer',
  },
  {
    id: '4',
    name: 'Peter Omondi',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'The lease agreement is ready for your review.',
    time: 'Yesterday',
    unread: 0,
    role: 'Landlord',
  },
];

export default function MessagesScreen() {
  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationCard} activeOpacity={0.7}>
      <Image
        source={{ uri: item.avatar }}
        style={styles.avatar}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.conversationInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.roleBadge}>{item.role}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={mockConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  time: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  roleBadge: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  lastMessage: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.matteClay,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  unreadText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
