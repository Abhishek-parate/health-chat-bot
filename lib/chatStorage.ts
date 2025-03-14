import { ChatMessage, Conversation } from '@/types';

export async function getConversations(): Promise<Conversation[]> {
  // In a real app, this would fetch from AsyncStorage or a database
  // Mock data for demonstration
  return [
    {
      id: '1',
      title: 'Nutrition Advice',
      preview: 'What foods should I eat for better nutrition?',
      lastMessageDate: new Date(Date.now() - 1000 * 60 * 30),
      category: 'Nutrition'
    },
    {
      id: '2',
      title: 'Workout Routine',
      preview: 'How often should I exercise?',
      lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 3),
      category: 'Exercise'
    },
    {
      id: '3',
      title: 'Sleep Improvement',
      preview: 'I\'m having trouble sleeping. Any advice?',
      lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      category: 'Sleep'
    },
    {
      id: '4',
      title: 'Mental Wellness',
      preview: 'What are good techniques for stress management?',
      lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
      category: 'Mental Health'
    }
  ];
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  // In a real app, this would fetch from AsyncStorage or a database
  // Mock data for demonstration
  const mockHistory: Record<string, ChatMessage[]> = {
    '1': [
      {
        id: '101',
        content: 'What foods should I eat for better nutrition?',
        role: 'user',
        createdAt: new Date(Date.now() - 1000 * 60 * 35)
      },
      {
        id: '102',
        content: 'Great question! For better nutrition, focus on a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains. Try to include more leafy greens in your diet for essential vitamins and minerals.',
        role: 'assistant',
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      }
    ],
    '2': [
      {
        id: '201',
        content: 'How often should I exercise?',
        role: 'user',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3 - 1000 * 60 * 5)
      },
      {
        id: '202',
        content: 'A combination of cardio and strength training 3-4 times per week is ideal for most people.',
        role: 'assistant',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
      }
    ],
    '3': [
      {
        id: '301',
        content: 'I\'m having trouble sleeping. Any advice?',
        role: 'user',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 5)
      },
      {
        id: '302',
        content: 'Consider establishing a regular sleep schedule and avoiding screens at least an hour before bedtime.',
        role: 'assistant',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    ],
    '4': [
      {
        id: '401',
        content: 'What are some good ways to manage stress?',
        role: 'user',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48 - 1000 * 60 * 5)
      },
      {
        id: '402',
        content: 'Regular mindfulness practice can help reduce stress and improve overall mental wellbeing.',
        role: 'assistant',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
      }
    ]
  };
  
  return mockHistory[conversationId] || [];
}