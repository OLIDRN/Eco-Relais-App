import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Divider, Text } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { apiGet, apiPut } from '@/services/api';
import { Notification } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

function notifIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes('accept'))                              return 'checkmark-circle-outline';
  if (type.includes('deliver') || type.includes('complet')) return 'ribbon-outline';
  if (type.includes('cancel'))                              return 'close-circle-outline';
  return 'notifications-outline';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── NotificationRow ────────────────────────────────────────────────────────

interface RowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationRow({ notification: n, onMarkRead }: RowProps) {
  const colors = useThemeColors();

  return (
    <>
      <Pressable
        onPress={() => { if (!n.read) onMarkRead(n.id); }}
        style={({ pressed }) => [
          styles.row,
          !n.read && { backgroundColor: colors.primaryLight + '40' },
          pressed && { opacity: 0.7 },
        ]}
      >
        {/* Icône avec dot non-lu */}
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={notifIcon(n.type)} size={20} color={colors.primary} />
          {!n.read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.error }]} />
          )}
        </View>

        {/* Texte */}
        <View style={styles.rowContent}>
          <Text
            variant="bodySmall"
            style={{ fontWeight: n.read ? '400' : '600' } as any}
          >
            {n.message}
          </Text>
          <Text variant="caption" color="textTertiary">
            {formatDate(n.created_at)}
          </Text>
        </View>
      </Pressable>
      <Divider spacing="none" />
    </>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onNotificationsRead?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function NotificationsModal({ visible, onClose, onNotificationsRead }: Props) {
  const colors     = useThemeColors();
  const translateY = useSharedValue(0);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch quand la modal s'ouvre
  useEffect(() => {
    if (visible) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function fetchNotifications(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiGet<{ notifications: Notification[] }>('/api/notifications');
      setNotifications(data.notifications ?? []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleMarkRead(id: string) {
    // Update optimiste
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    onNotificationsRead?.();
    try {
      await apiPut(`/api/notifications/${id}/read`, {});
    } catch {
      // on ne révert pas pour ne pas perturber l'UX
    }
  }

  // Pan gesture : swipe down pour fermer
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 600) {
        translateY.value = 0;
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  function handleClose() {
    translateY.value = 0;
    onClose();
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Fond semi-transparent */}
      <Pressable style={styles.backdrop} onPress={handleClose}>

        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.background, ...Shadows.xl }, sheetStyle]}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag handle */}
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
          </GestureDetector>

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h5">Notifications</Text>
            {unreadCount > 0 && (
              <Badge label={String(unreadCount)} variant="error" size="small" />
            )}
          </View>

          {/* Liste */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNotifications(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {!loading && notifications.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.textTertiary} />
                <Text variant="body" color="textSecondary" center style={styles.emptyText}>
                  Aucune notification pour le moment
                </Text>
              </View>
            )}

            {!loading && notifications.map(n => (
              <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkRead} />
            ))}

            <View style={{ height: Spacing.sm }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button title="Fermer" variant="outline" fullWidth onPress={handleClose} />
          </View>
        </Animated.View>

      </Pressable>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  handleArea: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
  },
  centered: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.xs,
  },
  // NotificationRow
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    position: 'absolute',
    top: -1,
    right: -1,
  },
  rowContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
