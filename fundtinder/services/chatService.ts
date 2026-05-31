import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { Message } from '@/types/message';

export const getProfilePictureUrl = (
  profilePictureUrl?: string,
  name?: string,
) => {
  if (profilePictureUrl?.trim()) {
    return profilePictureUrl;
  }

  return `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(
    name ?? 'User',
  )}&background=random&color=fff`;
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
) => {
  const q = query(
    collection(db, 'chat', chatId, 'messages'),
    orderBy('timestamp', 'asc'),
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, 'id'>),
    }));

    callback(messages);
  });
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  text: string,
) => {
  const timestamp = Date.now();

  await addDoc(collection(db, 'chat', chatId, 'messages'), {
    senderId,
    text,
    timestamp,
  });

  await updateDoc(doc(db, 'chat', chatId), {
    lastMessageAt: timestamp,
    lastMessageSenderId: senderId,
    lastMessageText: text,
  });
};

export const markChatAsRead = async (chatId: string, myAppId: string) => {
  await updateDoc(doc(db, 'chat', chatId), {
    [`lastRead.${myAppId}`]: Date.now(),
  });
};

export const subscribeUnreadStatus = (
  chatId: string,
  myAppId: string,
  callback: (hasUnread: boolean) => void,
) => {
  return onSnapshot(doc(db, 'chat', chatId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(false);
      return;
    }

    const data = snapshot.data();

    const myLastRead = data.lastRead?.[myAppId] ?? 0;

    callback(
      data.lastMessageSenderId !== myAppId && myLastRead < data.lastMessageAt,
    );
  });
};
