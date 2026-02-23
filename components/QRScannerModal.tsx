import { useEffect, useRef } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { Text, Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';

// ── Types ──────────────────────────────────────────────────────────────────

interface QRScannerModalProps {
  visible: boolean;
  title?: string;
  onScan: (data: string) => void;
  onClose: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const FRAME_SIZE = 240;
const CORNER_LEN = 28;
const CORNER_THICK = 3;

// ── Component ──────────────────────────────────────────────────────────────

export function QRScannerModal({
  visible,
  title = 'Scanner le QR code',
  onScan,
  onClose,
}: QRScannerModalProps) {
  const colors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  // Ref synchrone : évite les doubles appels avant que le state React ait le temps de se mettre à jour
  const scannedRef = useRef(false);

  // Réinitialise le guard à chaque ouverture
  useEffect(() => {
    if (visible) scannedRef.current = false;
  }, [visible]);

  if (!visible) return null;

  // Permissions non encore chargées
  if (!permission) return null;

  // Permissions refusées / non accordées → écran de demande
  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="camera-outline" size={56} color={colors.primary} />
          <Text variant="h5" center style={{ marginTop: Spacing.xl }}>
            Accès caméra requis
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            center
            style={{ marginTop: Spacing.sm, marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] }}
          >
            Nous avons besoin de votre caméra pour scanner le QR code du colis.
          </Text>
          <Button
            title="Autoriser la caméra"
            variant="primary"
            onPress={requestPermission}
            fullWidth
          />
          <Button
            title="Annuler"
            variant="ghost"
            onPress={onClose}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>

        {/* Caméra plein écran */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScan(data);
          }}
        />

        {/* Overlay sombre autour du cadre */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.shadowRow} />
          <View style={styles.middleRow}>
            <View style={styles.shadowSide} />
            {/* Cadre QR avec coins blancs */}
            <View style={[styles.frame, { borderColor: 'transparent' }]}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <View style={styles.shadowSide} />
          </View>
          <View style={styles.shadowRow} />
        </View>

        {/* Barre supérieure */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <Text variant="label" style={styles.topTitle}>
            {title}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Indication bas de page */}
        <View style={styles.bottomHint} pointerEvents="none">
          <Text variant="bodySmall" style={styles.hintText}>
            Placez le QR code dans le cadre
          </Text>
        </View>

      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const SHADOW_COLOR = 'rgba(0,0,0,0.65)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  shadowRow: {
    flex: 1,
    backgroundColor: SHADOW_COLOR,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  shadowSide: {
    flex: 1,
    backgroundColor: SHADOW_COLOR,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: '#fff',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderTopLeftRadius: BorderRadius.sm,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderTopRightRadius: BorderRadius.sm,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderBottomRightRadius: BorderRadius.sm,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
