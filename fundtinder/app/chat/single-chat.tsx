import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ChatView } from '@/components/ui/chat-view';

export default function SingleChatScreen() {
  const params = useLocalSearchParams();

  return (
    <ChatView
      chatId={params.chatId as string}
      otherAppId={params.otherAppId as string}
    />
  );
}
