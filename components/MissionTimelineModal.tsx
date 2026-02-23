import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Card, Divider, Text } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { Mission, MissionStatus, PackageSize } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const SIZE_LABEL: Record<PackageSize, string> = {
  small:  'Petit',
  medium: 'Moyen',
  large:  'Grand',
};

function formatPrice(price: number): string {
  return (Number(price) || 0).toFixed(2).replace('.', ',') + ' €';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Timeline ───────────────────────────────────────────────────────────────

const STATUS_RANK: Record<MissionStatus, number> = {
  pending: 0, accepted: 1, collected: 2, in_transit: 3, delivered: 4, cancelled: -1,
};

interface StepDef {
  id: string;
  rank: number;
  label: string;
  subInfo: (m: Mission) => string | null;
}

const STEPS: StepDef[] = [
  {
    id: 'pending', rank: 0, label: 'En attente',
    subInfo: (m) => formatDate(m.created_at),
  },
  {
    id: 'accepted', rank: 1, label: 'Assigné',
    subInfo: (m) => {
      const n = `${m.partner_first_name ?? ''} ${m.partner_last_name ?? ''}`.trim();
      return n || null;
    },
  },
  { id: 'collected',  rank: 2, label: 'Récupéré',     subInfo: () => null },
  { id: 'in_transit', rank: 3, label: 'En livraison',  subInfo: () => null },
  {
    id: 'delivered_or_cancelled', rank: 4, label: 'Livré',
    subInfo: (m) => m.status === 'delivered' && m.completed_at ? formatDate(m.completed_at) : null,
  },
];

function isDone(step: StepDef, m: Mission): boolean {
  if (m.status === 'cancelled') return step.id === 'pending';
  return STATUS_RANK[m.status] >= step.rank;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  mission: Mission | null;
  onClose: () => void;
  onShowQR?: (m: Mission) => void;
  onCancelMission?: (m: Mission) => void;
  onReportDispute?: (m: Mission) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MissionTimelineModal({ visible, mission, onClose, onShowQR, onCancelMission, onReportDispute }: Props) {
  const colors    = useThemeColors();
  const translateY = useSharedValue(0);

  // Pan gesture : suit le doigt, ferme si seuil atteint
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 600) {
        translateY.value = 0;
        runOnJS(onClose)();
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

  if (!mission) return null;

  const isCancelled  = mission.status === 'cancelled';
  const canShowQR    = !isCancelled && mission.status !== 'delivered';
  const canCancel    = mission.status === 'pending' && !!onCancelMission;
  const canDispute   = (mission.status === 'delivered' || mission.status === 'cancelled') && !!onReportDispute;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Fond semi-transparent — tap ferme */}
      <Pressable style={styles.backdrop} onPress={handleClose}>

        {/* Sheet animé */}
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.background, ...Shadows.xl }, sheetStyle]}
          onStartShouldSetResponder={() => true}
        >
          {/* ── Drag handle (zone de swipe) ── */}
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
          </GestureDetector>

          {/* ── Contenu scrollable ── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Photo */}
            {Boolean(mission.package_photo_url) && (
              <Image
                source={{ uri: mission.package_photo_url! }}
                style={styles.photo}
                resizeMode="cover"
              />
            )}

            {/* Infos colis */}
            <Card variant="outlined" style={styles.card}>
              <View style={styles.row}>
                <Text variant="label" style={styles.flex1} numberOfLines={1}>
                  {mission.package_title}
                </Text>
                <Badge label={SIZE_LABEL[mission.package_size]} variant="neutral" size="small" />
              </View>
              <View style={styles.row}>
                <Ionicons name="pricetag-outline" size={13} color={colors.textTertiary} />
                <Text variant="bodySmall" color="textSecondary" style={styles.ml}>
                  {formatPrice(mission.price)}
                </Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                <Text variant="bodySmall" color="textSecondary" style={styles.ml}>
                  {mission.pickup_time_slot}
                </Text>
              </View>
            </Card>

            {/* Adresses */}
            <Card variant="outlined" style={styles.card}>
              <View style={styles.addrBlock}>
                <View style={styles.addrTrack}>
                  <View style={[styles.addrDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.addrLine, { backgroundColor: colors.border }]} />
                  <View style={[styles.addrDot, { backgroundColor: colors.accent }]} />
                </View>
                <View style={styles.flex1}>
                  <View>
                    <Text variant="caption" color="textTertiary">Collecte</Text>
                    <Text variant="bodySmall" numberOfLines={2}>{mission.pickup_address}</Text>
                  </View>
                  <View style={{ height: Spacing.md }} />
                  <View>
                    <Text variant="caption" color="textTertiary">Livraison</Text>
                    <Text variant="bodySmall" numberOfLines={2}>{mission.delivery_address}</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Timeline */}
            <View style={styles.timelineWrap}>
              <Text variant="label" color="textSecondary" style={styles.timelineTitle}>
                Suivi de la mission
              </Text>

              {STEPS.map((step, i) => {
                const isLast       = i === STEPS.length - 1;
                const done         = isDone(step, mission);
                const isCancelStep = isCancelled && step.id === 'delivered_or_cancelled';
                const label        = isCancelStep ? 'Annulé' : step.label;
                const sub          = (done || isCancelStep) ? step.subInfo(mission) : null;
                const dotColor     = isCancelStep ? colors.error : done ? colors.primary : colors.border;
                const lineColor    = done && !isCancelStep ? colors.primary : colors.border;
                const textColor    = done || isCancelStep ? colors.text : colors.textTertiary;

                return (
                  <View key={step.id} style={styles.stepRow}>
                    {/* Dot + connecteur */}
                    <View style={styles.stepTrack}>
                      <View style={[
                        styles.dot,
                        done || isCancelStep
                          ? { backgroundColor: dotColor }
                          : { backgroundColor: 'transparent', borderWidth: 2, borderColor: dotColor },
                      ]} />
                      {!isLast && (
                        <View style={[styles.line, { backgroundColor: lineColor }]} />
                      )}
                    </View>
                    {/* Texte */}
                    <View style={styles.stepContent}>
                      <Text variant="label" style={{ color: textColor }}>
                        {label}{mission.status === 'delivered' && step.id === 'delivered_or_cancelled' ? ' ✓' : ''}
                      </Text>
                      {sub && (
                        <Text variant="caption" color="textSecondary">{sub}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ height: Spacing.sm }} />
          </ScrollView>

          {/* ── Footer (hors du scroll) ── */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {canShowQR && onShowQR && (
              <Button
                title={mission.status === 'in_transit' ? 'QR de livraison' : 'QR de collecte'}
                variant="outline"
                fullWidth
                leftIcon={<Ionicons name="qr-code-outline" size={16} color={colors.primary} />}
                onPress={() => { onShowQR(mission); handleClose(); }}
              />
            )}
            {canCancel && onCancelMission && (
              <Button
                title="Annuler la mission"
                variant="ghost"
                fullWidth
                leftIcon={<Ionicons name="close-circle-outline" size={16} color={colors.error} />}
                onPress={() => onCancelMission(mission)}
              />
            )}
            {canDispute && onReportDispute && (
              <Button
                title="Signaler un problème"
                variant="ghost"
                fullWidth
                leftIcon={<Ionicons name="warning-outline" size={16} color={colors.warning} />}
                onPress={() => { onReportDispute(mission); handleClose(); }}
              />
            )}
            <Button
              title="Fermer"
              variant={canShowQR || canCancel || canDispute ? 'ghost' : 'outline'}
              fullWidth
              onPress={handleClose}
            />
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
    maxHeight: '88%',
  },
  // Drag handle
  handleArea: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  // Scroll
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  // Cards
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flex1: { flex: 1 },
  ml: { marginLeft: Spacing.xs },
  // Adresses
  addrBlock: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  addrTrack: {
    alignItems: 'center',
    paddingTop: 3,
  },
  addrDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  addrLine: {
    width: 1.5, flex: 1, minHeight: Spacing.xl, marginVertical: 3,
  },
  // Timeline
  timelineWrap: {
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  timelineTitle: {
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepTrack: {
    alignItems: 'center',
    width: 24,
    marginRight: Spacing.md,
  },
  dot: {
    width: 14, height: 14, borderRadius: 7,
  },
  line: {
    width: 2, minHeight: 28, marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  // Footer
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
