import { apiFetch } from './api';

export interface ChatMessage {
  sender: 'client' | 'advisor';
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  clientName: string;
  category: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
}

export const messageService = {
  async getThreads(): Promise<ChatThread[]> {
    try {
      const data = await apiFetch<ChatThread[]>('/messages/threads');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Offline / no DB fallback
    }
    return [
      {
        id: 't1',
        clientName: 'Rajesh Jhunjhunwala',
        category: 'UHNI',
        lastMsg: 'Hi Nitin, please send me the latest PMS performance report for Q2.',
        time: '10:15 AM',
        unread: false,
        messages: [
          { sender: 'client', text: 'Hi Nitin, please send me the latest PMS performance report for Q2.', time: '10:15 AM' },
          { sender: 'advisor', text: 'Sure Mr. Jhunjhunwala, I will prepare and share the detailed report shortly.', time: '10:18 AM' }
        ]
      },
      {
        id: 't2',
        clientName: 'Ananya Sharma',
        category: 'UHNI',
        lastMsg: 'Hello, can we schedule a call to discuss REITs allocation?',
        time: '11:45 AM',
        unread: false,
        messages: [
          { sender: 'client', text: 'Hello, can we schedule a call to discuss REITs allocation?', time: '11:45 AM' }
        ]
      }
    ];
  },

  async sendMessage(threadId: string, clientName: string, text: string): Promise<void> {
    try {
      await apiFetch<any>('/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          thread_id: threadId,
          client_name: clientName,
          text: text
        })
      });
    } catch {
      // Local fallback handled in App.tsx state
    }
  },

  async markThreadRead(threadId: string): Promise<void> {
    try {
      await apiFetch<any>(`/messages/threads/${threadId}/read`, {
        method: 'PUT'
      });
    } catch {
      // Local fallback handled in App.tsx state
    }
  }
};
