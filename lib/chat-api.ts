import { apiClient } from './api';
import type {
  ChatResponse,
  SingleChatResponse,
  MessageResponse,
  SingleMessageResponse,
  ParticipantsResponse,
  ChatQueryParams,
  MessageQueryParams,
  SendMessageData,
  EditMessageData,
  MarkAsReadData,
  CreateChatData
} from '@/types/chat';

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Chat Rooms API functions
export const chatRoomsApi = {
  // Get all chat rooms for user's department
  getDepartmentChats: async (params: ChatQueryParams = {}): Promise<ChatResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<ChatResponse>(`/chat/department${queryString}`);
  },

  // Get or create department chat room
  getOrCreateDepartmentChat: async (): Promise<SingleChatResponse> => {
    return apiClient.get<SingleChatResponse>('/chat/department/room');
  },

  // Create a new chat room (for future group chats)
  createChat: async (data: CreateChatData): Promise<SingleChatResponse> => {
    return apiClient.post<SingleChatResponse>('/chat', data);
  }
};

// Messages API functions
export const messagesApi = {
  // Get messages for a chat room
  getChatMessages: async (chatId: string, params: MessageQueryParams = {}): Promise<MessageResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<MessageResponse>(`/chat/${chatId}/messages${queryString}`);
  },

  // Send a new message
  sendMessage: async (chatId: string, data: SendMessageData): Promise<SingleMessageResponse> => {
    return apiClient.post<SingleMessageResponse>(`/chat/${chatId}/messages`, data);
  },

  // Edit a message
  editMessage: async (messageId: string, data: EditMessageData): Promise<SingleMessageResponse> => {
    return apiClient.put<SingleMessageResponse>(`/chat/messages/${messageId}`, data);
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<{ success: boolean; message: string; data: { id: string; isDeleted: boolean } }> => {
    return apiClient.delete<{ success: boolean; message: string; data: { id: string; isDeleted: boolean } }>(`/chat/messages/${messageId}`);
  },

  // Mark messages as read
  markAsRead: async (chatId: string, data: MarkAsReadData = {}): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/chat/${chatId}/read`, data);
  }
};

// Participants API functions
export const participantsApi = {
  // Get chat participants
  getChatParticipants: async (chatId: string): Promise<ParticipantsResponse> => {
    return apiClient.get<ParticipantsResponse>(`/chat/${chatId}/participants`);
  }
};

// User Status API functions
export const userStatusApi = {
  // Update user's online status
  updateOnlineStatus: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/chat/status/online');
  }
};

// Combined chat API
export const chatApi = {
  rooms: chatRoomsApi,
  messages: messagesApi,
  participants: participantsApi,
  status: userStatusApi
};

// Export types for use in components
export type {
  ChatResponse,
  SingleChatResponse,
  MessageResponse,
  SingleMessageResponse,
  ParticipantsResponse,
  ChatQueryParams,
  MessageQueryParams,
  SendMessageData,
  EditMessageData,
  MarkAsReadData,
  CreateChatData
};
