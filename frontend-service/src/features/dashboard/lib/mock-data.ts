export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  isOnline: boolean;
  isVerified?: boolean;
}

export interface ChatPreview {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isTyping?: boolean;
}

export interface GroupPreview {
  id: string;
  name: string;
  members: User[];
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatarUrl?: string;
  avatarBg?: string;
}

export interface CallPreview {
  id: string;
  user: User;
  type: "audio" | "video";
  status: "missed" | "completed";
  duration?: string;
  time: string;
}

export const mockUsers: Record<string, User> = {
  aarav: { id: "1", name: "Aarav Sharma", initials: "AS", isOnline: true, isVerified: true },
  priya: { id: "2", name: "Priya Sharma", initials: "PS", isOnline: true },
  rahul: { id: "3", name: "Rahul Kumar", initials: "RK", isOnline: false },
  sneha: { id: "4", name: "Sneha Kapoor", initials: "SK", isOnline: true, isVerified: true },
  tanvi: { id: "5", name: "Tanvi Mehta", initials: "TM", isOnline: false },
};

export const recentChats: ChatPreview[] = [
  { id: "c1", user: mockUsers.aarav, lastMessage: "Can we review the new designs today?", time: "2m ago", unreadCount: 2, isTyping: true },
  { id: "c2", user: mockUsers.priya, lastMessage: "LGTM! I will merge the PR now.", time: "1h ago", unreadCount: 0 },
  { id: "c3", user: mockUsers.rahul, lastMessage: "Thanks for the update.", time: "Yesterday", unreadCount: 0 },
];

export const activeGroups: GroupPreview[] = [
  { 
    id: "g1", 
    name: "Engineering Team", 
    members: [mockUsers.aarav, mockUsers.priya, mockUsers.rahul], 
    lastMessage: "Priya: LGTM! I will merge the PR now.", 
    time: "10:42 AM", 
    unreadCount: 5 
  },
  { 
    id: "g2", 
    name: "Design Sync", 
    members: [mockUsers.sneha, mockUsers.tanvi, mockUsers.aarav], 
    lastMessage: "Sneha: Attached the new Figma link", 
    time: "Yesterday", 
    unreadCount: 0 
  },
];

export const recentCalls: CallPreview[] = [
  { id: "cl1", user: mockUsers.sneha, type: "video", status: "completed", duration: "45m 12s", time: "Today, 10:30 AM" },
  { id: "cl2", user: mockUsers.tanvi, type: "audio", status: "missed", time: "Yesterday, 4:15 PM" },
];
