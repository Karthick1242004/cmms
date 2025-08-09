"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { MessageCircle, Send, Users, Phone, Video, MoreVertical } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function ChatPage() {
  const {
    chats,
    currentChat,
    messages,
    participants,
    isLoadingChats,
    isLoadingMessages,
    isSendingMessage,
    setCurrentChat,
    fetchDepartmentChats,
    fetchOrCreateDepartmentChat,
    fetchChatMessages,
    fetchChatParticipants,
    sendMessage,
    markMessagesAsRead,
    clearChat
  } = useChatStore()

  const { user } = useAuthStore()
  const [messageInput, setMessageInput] = useState("")
  const [showParticipants, setShowParticipants] = useState(false)

  // Fetch department chat on mount
  useEffect(() => {
    if (user) {
      fetchOrCreateDepartmentChat()
      fetchDepartmentChats()
    }
  }, [user, fetchOrCreateDepartmentChat, fetchDepartmentChats])

  // Auto-select the first available chat
  useEffect(() => {
    if (chats.length > 0 && !currentChat) {
      setCurrentChat(chats[0])
    }
  }, [chats, currentChat, setCurrentChat])

  // Fetch messages when current chat changes
  useEffect(() => {
    if (currentChat) {
      fetchChatMessages(currentChat.id)
      fetchChatParticipants(currentChat.id)
      markMessagesAsRead(currentChat.id)
    }
  }, [currentChat, fetchChatMessages, fetchChatParticipants, markMessagesAsRead])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChat || isSendingMessage) return

    try {
      await sendMessage(currentChat.id, {
        content: messageInput.trim(),
        messageType: 'text'
      })
      setMessageInput("")
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }



  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Department Chat</h1>
            <p className="text-muted-foreground">
              Connect with your {user?.department} department colleagues
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {participants.length} members
            </Badge>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <div className="flex h-[calc(100vh-12rem)] gap-6">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <MessageCircle className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{currentChat.name}</CardTitle>
                          <CardDescription>
                            {participants.length} participants • {currentChat.department} Department
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button> */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowParticipants(!showParticipants)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {/* <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Messages Area */}
                <Card className="flex-1 flex flex-col">
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-4">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-sm text-muted-foreground">Loading messages...</div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No messages yet</h3>
                            <p className="text-sm text-muted-foreground">
                              Start the conversation with your department colleagues
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-3",
                                message.isOwnMessage && "flex-row-reverse"
                              )}
                            >
                              {!message.isOwnMessage && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.senderAvatar} />
                                  <AvatarFallback>
                                    {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "max-w-[70%] space-y-1",
                                message.isOwnMessage && "text-right"
                              )}>
                                {!message.isOwnMessage && (
                                  <div className="text-xs text-muted-foreground">
                                    {message.senderName}
                                  </div>
                                )}
                                <div className={cn(
                                  "rounded-lg px-3 py-2 text-sm",
                                  message.isOwnMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}>
                                  {message.isDeleted ? (
                                    <em className="text-muted-foreground">{message.content}</em>
                                  ) : (
                                    message.content
                                  )}
                                  {message.isEdited && (
                                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(message.createdAt), 'h:mm a')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                  
                  {/* Message Input */}
                  <Separator />
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSendingMessage}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSendingMessage}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Department Chat</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a conversation or start chatting with your department
                  </p>
                  <Button onClick={() => fetchOrCreateDepartmentChat()}>
                    Join Department Chat
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Participants Sidebar */}
          {showParticipants && currentChat && (
            <div className="w-64 flex flex-col">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="text-lg">Participants</CardTitle>
                  <CardDescription>{participants.length} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.user?.avatar} />
                            <AvatarFallback>
                              {participant.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{participant.userName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{participant.role}</p>
                          </div>
                          {participant.isOnline && (
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  )
}
