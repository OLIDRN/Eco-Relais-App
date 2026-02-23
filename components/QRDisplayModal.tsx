import { Modal, View, Pressable, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

// ── Types ──────────────────────────────────────────────────────────────────

interface QRDisplayModalProps {
  visible: boolean;
  qrValue: string;
  missionTitle: string;
  hint?: string;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function QRDisplayModal({
  visible,
  qrValue,
  missionTitle,
  hint = 'Montrez ce code au Voisin-Relais lors de la collecte',
  onClose,
}: QRDisplayModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Fond semi-transparent — tap en dehors ferme la modal */}
      <Pressable style={styles.backdrop} onPress={onClose}>

        {/* Carte centrale — stoppe la propagation du tap */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.surfaceElevated, ...Shadows.xl }]}
          onPress={() => {}}
        >
          {/* Bouton fermer */}
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>

          <Text variant="h5" center>
            QR Code du colis
          </Text>
          <Text
            variant="caption"
            color="textSecondary"
            center
            style={styles.subtitle}
          >
            {missionTitle}
          </Text>

          {/* QR Code sur fond blanc (requis pour lecture caméra) */}
          <View style={[styles.qrWrapper, { borderColor: colors.border }]}>
            <QRCode
              value={qrValue || 'invalid'}
              size={200}
              color="#000"
              backgroundColor="#fff"
              ecl="M"
            />
          </View>

          <Text
            variant="bodySmall"
            color="textTertiary"
            center
            style={styles.hint}
          >
            {hint}
          </Text>
        </Pressable>

      </Pressable>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  qrWrapper: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  hint: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
