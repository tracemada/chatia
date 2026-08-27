import { Conversation } from '../types';

/**
 * Group labels for conversation history:
 * - Aujourd'hui
 * - Hier
 * - 7 derniers jours
 * - Plus anciennes
 */
export type GroupCategory = 'Aujourd\'hui' | 'Hier' | '7 derniers jours' | 'Plus anciennes';

export interface GroupedConversations {
  category: GroupCategory;
  conversations: Conversation[];
}

export function groupConversationsByDate(conversations: Conversation[]): GroupedConversations[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const last7Days: Conversation[] = [];
  const older: Conversation[] = [];

  // Sort descending by updatedAt
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const conv of sorted) {
    const time = conv.updatedAt;
    if (time >= startOfToday) {
      today.push(conv);
    } else if (time >= startOfYesterday) {
      yesterday.push(conv);
    } else if (time >= startOf7Days) {
      last7Days.push(conv);
    } else {
      older.push(conv);
    }
  }

  const groups: GroupedConversations[] = [];

  if (today.length > 0) {
    groups.push({ category: 'Aujourd\'hui', conversations: today });
  }
  if (yesterday.length > 0) {
    groups.push({ category: 'Hier', conversations: yesterday });
  }
  if (last7Days.length > 0) {
    groups.push({ category: '7 derniers jours', conversations: last7Days });
  }
  if (older.length > 0) {
    groups.push({ category: 'Plus anciennes', conversations: older });
  }

  return groups;
}
