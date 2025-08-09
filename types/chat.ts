// Chat-related types for the frontend

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  role: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderDepartment: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    createdAt: string;
  };
  editedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  readBy: {
    userId: string;
    userName: string;
    readAt: string;
  }[];
  reactions: {
    emoji: string;
    userId: string;
    userName: string;
    reactedAt: string;
  }[];
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  isOwnMessage?: boolean;
  isUnread?: boolean;
}

export interface Chat {
  id: string;
  department: string;
  departmentId?: string;
  name: string;
  description?: string;
  type: 'department' | 'group' | 'direct';
  participants: User[];
  participantCount: number;
  lastMessage?: {
    messageId: string;
    content: string;
    senderId: string;
    senderName: string;
    sentAt: string;
    messageType: 'text' | 'file' | 'image';
  };
  lastActivity: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  lastSeenAt?: string;
  lastMessageReadAt?: string;
  notificationSettings: {
    muted: boolean;
    mutedUntil?: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  isActive: boolean;
  leftAt?: string;
  isOnline?: boolean;
  user?: User;
}

// API response types
export interface ChatResponse {
  success: boolean;
  data: {
    chats: Chat[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

export interface SingleChatResponse {
  success: boolean;
  data: Chat;
  message: string;
}

export interface MessageResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

export interface SingleMessageResponse {
  success: boolean;
  data: Message;
  message: string;
}

export interface ParticipantsResponse {
  success: boolean;
  data: {
    participants: ChatParticipant[];
    totalCount: number;
  };
  message: string;
}

// Query parameters
export interface ChatQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface MessageQueryParams {
  page?: number;
  limit?: number;
  before?: string;
}

// Form data types
export interface SendMessageData {
  content: string;
  messageType?: 'text' | 'file' | 'image';
  replyTo?: string;
  mentions?: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface EditMessageData {
  content: string;
}

export interface MarkAsReadData {
  lastMessageId?: string;
}

export interface CreateChatData {
  name: string;
  description?: string;
  type?: 'department' | 'group' | 'direct';
  participants?: string[];
}

// Chat state interface
export interface ChatState {
  // Data
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  participants: ChatParticipant[];
  
  // UI State
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isLoadingParticipants: boolean;
  isSendingMessage: boolean;
  
  // Filters and search
  searchTerm: string;
  activeChatId: string | null;
  
  // Pagination
  chatsPagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  messagesPagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Actions
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setParticipants: (participants: ChatParticipant[]) => void;
  
  setSearchTerm: (term: string) => void;
  setActiveChatId: (chatId: string | null) => void;
  
  setLoadingChats: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setLoadingParticipants: (loading: boolean) => void;
  setSendingMessage: (sending: boolean) => void;
  
  // API methods
  fetchDepartmentChats: (params?: ChatQueryParams) => Promise<void>;
  fetchOrCreateDepartmentChat: () => Promise<Chat | null>;
  fetchChatMessages: (chatId: string, params?: MessageQueryParams) => Promise<void>;
  fetchChatParticipants: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, data: SendMessageData) => Promise<Message | null>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (chatId: string, data?: MarkAsReadData) => Promise<void>;
  updateOnlineStatus: () => Promise<void>;
  
  // Utility methods
  clearChat: () => void;
  getUnreadCount: () => number;
  isUserOnline: (userId: string) => boolean;
  filterChats: () => Chat[];
}

// UI component props
export interface ChatListProps {
  chats: Chat[];
  currentChatId?: string;
  onChatSelect: (chat: Chat) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  isLoading?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  isLoading?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (data: SendMessageData) => void;
  replyTo?: Message;
  onCancelReply: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChatHeaderProps {
  chat?: Chat;
  participantCount?: number;
  onlineCount?: number;
  onShowParticipants: () => void;
  onShowInfo: () => void;
}

export interface ParticipantListProps {
  participants: ChatParticipant[];
  currentUserId: string;
  isLoading?: boolean;
}
