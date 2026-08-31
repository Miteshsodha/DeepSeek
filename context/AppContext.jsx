"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
    const { user } = useUser();
    const { getToken } = useAuth();

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const createNewChat = async () => {
        try {
            if (!user) return null;

            const token = await getToken();

            await axios.post(
                '/api/chat/create',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchUsersChats();
        } catch (error) {
            console.error("Create Chat Error:", error);
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const fetchUsersChats = async () => {
        try {
            if (!user) return;

            const token = await getToken();

            // ✅ FIXED axios.get syntax
            const { data } = await axios.get('/api/chat/get', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Chats API Response:", data);

            if (data?.success) {
                const chatsData = data.data || [];

                setChats(chatsData);

                // If no chats, create one automatically
                if (chatsData.length === 0) {
                    await createNewChat();
                    return;
                }

                // Sort by latest updated
                const sortedChats = [...chatsData].sort(
                    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                );

                // Set latest chat as selected
                setSelectedChat(sortedChats[0]);
            } else {
                toast.error(data?.message || "Failed to fetch chats");
            }
        } catch (error) {
            console.error("Fetch Chats Error:", error);
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    // ✅ NEW: Auto-rename chat based on first user message
    const autoRenameChat = async (chatId, firstMessage) => {
        try {
            // Generate chat name from first message
            let chatName = firstMessage.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            
            if (chatName.length > 40) {
                chatName = chatName.split(' ').slice(0, 5).join(' ') + '...';
            }
            
            if (!chatName) chatName = 'New Chat';

            const token = await getToken();

            const { data } = await axios.post('/api/chat/rename', {
                chatId: chatId,
                name: chatName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (data?.success) {
                // Refresh chats to reflect new name
                await fetchUsersChats();
            }
        } catch (error) {
            console.error("Auto-rename error:", error);
            // Silently fail - don't show error to user for auto-rename
        }
    };

    useEffect(() => {
        if (user) {
            fetchUsersChats();
        }
    }, [user]);

    const value = {
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat, // ✅ Proper naming (important)
        fetchUsersChats,
        createNewChat,
        autoRenameChat, // ✅ NEW: Export auto-rename function
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
