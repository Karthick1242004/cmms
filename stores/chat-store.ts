import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { 
  Chat, 
  Message, 
  ChatParticipant, 
  ChatState, 
  ChatQueryParams, 
  MessageQueryParams, 
  SendMessageData, 
  EditMessageData, 
  MarkAsReadData 
} from "@/types/chat"
import { chatApi } from "@/lib/chat-api"

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Data
        chats: [],
        currentChat: null,
        messages: [],
        participants: [],
        
        // UI State
        isLoadingChats: false,
        isLoadingMessages: false,
        isLoadingParticipants: false,
        isSendingMessage: false,
        
        // Filters and search
        searchTerm: "",
        activeChatId: null,
        
        // Pagination
        chatsPagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrevious: false,
        },
        messagesPagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrevious: false,
        },
        
        // Setters
        setChats: (chats) =>
          set((state) => {
            state.chats = chats
          }),

        setCurrentChat: (chat) =>
          set((state) => {
            state.currentChat = chat
            state.activeChatId = chat?.id || null
            // Clear messages when switching chats
            if (chat && state.currentChat?.id !== chat.id) {
              state.messages = []
              state.messagesPagination = {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasNext: false,
                hasPrevious: false,
              }
            }
          }),

        setMessages: (messages) =>
          set((state) => {
            state.messages = messages
          }),

        addMessage: (message) =>
          set((state) => {
            // Add message to the end of the array (newest)
            state.messages.push(message)
            
            // Update current chat's last message if this is for the current chat
            if (state.currentChat && state.currentChat.id === message.chatId) {
              state.currentChat.lastMessage = {
                messageId: message.id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                sentAt: message.createdAt,
                messageType: message.messageType
              }
              state.currentChat.lastActivity = message.createdAt
            }

            // Update the chat in the chats list
            const chatIndex = state.chats.findIndex(chat => chat.id === message.chatId)
            if (chatIndex !== -1) {
              state.chats[chatIndex].lastMessage = {
                messageId: message.id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                sentAt: message.createdAt,
                messageType: message.messageType
              }
              state.chats[chatIndex].lastActivity = message.createdAt
              
              // Move this chat to the top of the list
              const chat = state.chats.splice(chatIndex, 1)[0]
              state.chats.unshift(chat)
            }
          }),

        updateMessage: (messageId, updates) =>
          set((state) => {
            const messageIndex = state.messages.findIndex(msg => msg.id === messageId)
            if (messageIndex !== -1) {
              state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates }
            }
          }),

        removeMessage: (messageId) =>
          set((state) => {
            const messageIndex = state.messages.findIndex(msg => msg.id === messageId)
            if (messageIndex !== -1) {
              state.messages[messageIndex].isDeleted = true
              state.messages[messageIndex].content = 'This message has been deleted'
            }
          }),

        setParticipants: (participants) =>
          set((state) => {
            state.participants = participants
          }),

        setSearchTerm: (term) =>
          set((state) => {
            state.searchTerm = term
          }),

        setActiveChatId: (chatId) =>
          set((state) => {
            state.activeChatId = chatId
          }),

        setLoadingChats: (loading) =>
          set((state) => {
            state.isLoadingChats = loading
          }),

        setLoadingMessages: (loading) =>
          set((state) => {
            state.isLoadingMessages = loading
          }),

        setLoadingParticipants: (loading) =>
          set((state) => {
            state.isLoadingParticipants = loading
          }),

        setSendingMessage: (sending) =>
          set((state) => {
            state.isSendingMessage = sending
          }),

        // API methods
        fetchDepartmentChats: async (params = {}) => {
          set((state) => {
            state.isLoadingChats = true
          })

          try {
            const response = await chatApi.rooms.getDepartmentChats(params)
            
            set((state) => {
              state.chats = response.data.chats
              state.chatsPagination = response.data.pagination
              state.isLoadingChats = false
            })
          } catch (error) {
            console.error('Error fetching department chats:', error)
            set((state) => {
              state.isLoadingChats = false
            })
            throw error
          }
        },

        fetchOrCreateDepartmentChat: async () => {
          try {
            const response = await chatApi.rooms.getOrCreateDepartmentChat()
            
            set((state) => {
              state.currentChat = response.data
              state.activeChatId = response.data.id
              
              // Add or update this chat in the chats list
              const existingIndex = state.chats.findIndex(chat => chat.id === response.data.id)
              if (existingIndex !== -1) {
                state.chats[existingIndex] = response.data
              } else {
                state.chats.unshift(response.data)
              }
            })

            return response.data
          } catch (error) {
            console.error('Error fetching/creating department chat:', error)
            throw error
          }
        },

        fetchChatMessages: async (chatId, params = {}) => {
          set((state) => {
            state.isLoadingMessages = true
          })

          try {
            const response = await chatApi.messages.getChatMessages(chatId, params)
            
            set((state) => {
              // If this is the first page, replace messages; otherwise append
              if (params.page === 1 || !params.page) {
                state.messages = response.data.messages
              } else {
                // Prepend older messages to the beginning of the array
                state.messages = [...response.data.messages, ...state.messages]
              }
              state.messagesPagination = response.data.pagination
              state.isLoadingMessages = false
            })
          } catch (error) {
            console.error('Error fetching chat messages:', error)
            set((state) => {
              state.isLoadingMessages = false
            })
            throw error
          }
        },

        fetchChatParticipants: async (chatId) => {
          set((state) => {
            state.isLoadingParticipants = true
          })

          try {
            const response = await chatApi.participants.getChatParticipants(chatId)
            
            set((state) => {
              state.participants = response.data.participants
              state.isLoadingParticipants = false
            })
          } catch (error) {
            console.error('Error fetching chat participants:', error)
            set((state) => {
              state.isLoadingParticipants = false
            })
            throw error
          }
        },

        sendMessage: async (chatId, data) => {
          set((state) => {
            state.isSendingMessage = true
          })

          try {
            const response = await chatApi.messages.sendMessage(chatId, data)
            
            // Add the message to the store
            get().addMessage(response.data)
            
            set((state) => {
              state.isSendingMessage = false
            })

            return response.data
          } catch (error) {
            console.error('Error sending message:', error)
            set((state) => {
              state.isSendingMessage = false
            })
            throw error
          }
        },

        editMessage: async (messageId, data) => {
          try {
            const response = await chatApi.messages.editMessage(messageId, data)
            
            // Update the message in the store
            get().updateMessage(messageId, response.data)
          } catch (error) {
            console.error('Error editing message:', error)
            throw error
          }
        },

        deleteMessage: async (messageId) => {
          try {
            await chatApi.messages.deleteMessage(messageId)
            
            // Remove the message from the store
            get().removeMessage(messageId)
          } catch (error) {
            console.error('Error deleting message:', error)
            throw error
          }
        },

        markMessagesAsRead: async (chatId, data = {}) => {
          try {
            await chatApi.messages.markAsRead(chatId, data)
            
            // Update unread count for the chat
            set((state) => {
              const chatIndex = state.chats.findIndex(chat => chat.id === chatId)
              if (chatIndex !== -1) {
                state.chats[chatIndex].unreadCount = 0
              }
            })
          } catch (error) {
            console.error('Error marking messages as read:', error)
            throw error
          }
        },

        updateOnlineStatus: async () => {
          try {
            await chatApi.status.updateOnlineStatus()
          } catch (error) {
            console.error('Error updating online status:', error)
            // Don't throw error for online status updates
          }
        },

        // Utility methods
        clearChat: () =>
          set((state) => {
            state.currentChat = null
            state.messages = []
            state.participants = []
            state.activeChatId = null
            state.messagesPagination = {
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              hasNext: false,
              hasPrevious: false,
            }
          }),

        getUnreadCount: () => {
          const { chats } = get()
          return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
        },

        isUserOnline: (userId) => {
          const { participants } = get()
          const participant = participants.find(p => p.userId === userId)
          return participant?.isOnline || false
        },

        filterChats: () => {
          const { chats, searchTerm } = get()
          if (!searchTerm.trim()) return chats
          
          const term = searchTerm.toLowerCase()
          return chats.filter(chat =>
            chat.name.toLowerCase().includes(term) ||
            chat.description?.toLowerCase().includes(term) ||
            chat.lastMessage?.content.toLowerCase().includes(term)
          )
        },
      })),
      {
        name: "chat-storage",
        partialize: (state) => ({
          // Don't persist API data, always fetch fresh
          searchTerm: state.searchTerm,
          activeChatId: state.activeChatId,
        }),
      }
    ),
    { name: "chat-store" }
  )
)

// Utility function to update online status periodically
export const startOnlineStatusUpdates = () => {
  const updateInterval = setInterval(() => {
    const { updateOnlineStatus } = useChatStore.getState()
    updateOnlineStatus()
  }, 30000) // Update every 30 seconds

  // Return cleanup function
  return () => clearInterval(updateInterval)
}
