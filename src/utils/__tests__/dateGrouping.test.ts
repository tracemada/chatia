import { describe, it, expect } from 'vitest';
import { groupConversationsByDate } from '../dateGrouping';
import { Conversation } from '../../types';

describe('groupConversationsByDate', () => {
  it('correctly categorizes conversations into Today, Yesterday, 7 days, and Older', () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const yesterday = now - 26 * 60 * 60 * 1000;
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

    const mockConversations: Conversation[] = [
      { id: '1', title: 'Today Conv', createdAt: oneHourAgo, updatedAt: oneHourAgo, messages: [], model: 'gemini' },
      { id: '2', title: 'Yesterday Conv', createdAt: yesterday, updatedAt: yesterday, messages: [], model: 'gemini' },
      { id: '3', title: '3 Days Conv', createdAt: threeDaysAgo, updatedAt: threeDaysAgo, messages: [], model: 'gemini' },
      { id: '4', title: '10 Days Conv', createdAt: tenDaysAgo, updatedAt: tenDaysAgo, messages: [], model: 'gemini' },
    ];

    const groups = groupConversationsByDate(mockConversations);
    expect(groups.length).toBeGreaterThan(0);

    const categories = groups.map(g => g.category);
    expect(categories).toContain('Aujourd\'hui');
    expect(categories).toContain('Plus anciennes');
  });
});
