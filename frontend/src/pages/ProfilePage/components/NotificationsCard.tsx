import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Box, Heading, Text, Stack, Flex, Badge } from "../../../design-system/primitives";
import { useAuth } from "../../../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

const ScrollableList = styled(Stack)`
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #dcdcdc; border-radius: 4px; }
`;

const NotifItem = styled(Box)<{ $read: boolean }>`
  cursor: pointer;
  background: ${({ $read }) => ($read ? "#fff" : "#f0f7ff")};
  border: 1px solid ${({ $read }) => ($read ? "#eee" : "#d0e2ff")};
  border-left: 4px solid ${({ $read, theme }) => ($read ? "#ddd" : theme.colors.brand.primary)};
  transition: all 0.2s;
  
  &:hover {
    background: #fafafa;
    border-color: #ccc;
  }
`;

const NotificationsCard: React.FC = () => {
  const { refreshNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/me/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif: Notification) => {
    if (notif.is_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );

    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${API_BASE}/notifications/${notif.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshNotificationsCount();
    } catch (e) {
      console.error("Błąd oznaczania powiadomienia", e);
    }
  };

  return (
    <Box $bg="#fff" $p="lg" $radius="xl" $shadow="sm" style={{ height: "100%" }}>
      <Stack $gap="md">
        <Heading $level="h3">Powiadomienia</Heading>
        <Text $variant="body2" $tone="muted">
          Kliknij na powiadomienie, aby oznaczyć je jako przeczytane.
        </Text>

        {loading ? (
          <Text $variant="body2">Ładowanie...</Text>
        ) : notifications.length === 0 ? (
          <Text $variant="body2" $tone="muted" style={{ fontStyle: "italic" }}>
            Brak nowych powiadomień. Spokój i cisza.
          </Text>
        ) : (
          <ScrollableList $gap="sm">
            {notifications.map((n) => (
              <NotifItem
                key={n.id}
                $read={n.is_read}
                $p="md"
                $radius="md"
                onClick={() => handleMarkAsRead(n)}
              >
                <Flex $justify="space-between" $align="center" style={{ marginBottom: 4 }}>
                  <Text 
                    $variant="body2" 
                    style={{ fontWeight: n.is_read ? 400 : 700 }}
                  >
                    {n.title}
                  </Text>

                  {!n.is_read && (
                    <Badge 
                      $variant="neutral" 
                      style={{ 
                        fontSize: 10, 
                        padding: "2px 6px",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        borderColor: "#bbdefb"
                      }}
                    >
                      NOWE
                    </Badge>
                  )}
                </Flex>
                
                <Text $variant="body3" $tone="muted">
                  {new Date(n.created_at).toLocaleDateString()}
                </Text>
                <Text 
                $variant="body2" 
                style={{ 
                    marginTop: 8,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                }}
                >
                {n.message}
                </Text>
              </NotifItem>
            ))}
          </ScrollableList>
        )}
      </Stack>
    </Box>
  );
};

export default NotificationsCard;