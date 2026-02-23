import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { apiPost } from '@/services/api';
import { Dispute, Mission } from '@/types/api';

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  mission: Mission | null;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function DisputeModal({ visible, mission, onClose }: Props) {
  const colors = useThemeColors();

  const [reason, setReason]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Reset à chaque ouverture
  useEffect(() => {
    if (visible) {
      setReason('');
      setError('');
      setSuccess(false);
    }
  }, [visible]);

  if (!mission) return null;

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Veuillez décrire le problème rencontré.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiPost<{ dispute: Dispute }>('/api/disputes', {
        mission_id: mission!.id,
        reason: reason.trim(),
      });
      setSuccess(true);
    } catch {
      setError('Impossible d\'envoyer le litige. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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

          <Ionicons name="warning-outline" size={36} color={colors.warning} />

          <Text variant="h5" center style={styles.title}>
            Signaler un problème
          </Text>
          <Text variant="caption" color="textSecondary" center style={styles.subtitle}>
            {mission.package_title}
          </Text>

          {success ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text variant="body" color="textSecondary" center style={styles.successText}>
                Votre litige a été enregistré. Notre équipe vous contactera rapidement.
              </Text>
              <Button title="Fermer" variant="outline" fullWidth onPress={onClose} />
            </>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="Décrivez le problème rencontré..."
                placeholderTextColor={colors.textTertiary}
                value={reason}
                onChangeText={(v) => { setReason(v); setError(''); }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {error !== '' && (
                <Text variant="caption" color="error" style={styles.errorText}>
                  {error}
                </Text>
              )}
              <Button
                title="Envoyer"
                variant="primary"
                fullWidth
                loading={loading}
                onPress={handleSubmit}
                leftIcon={<Ionicons name="send-outline" size={16} color="#fff" />}
              />
              <Button
                title="Annuler"
                variant="ghost"
                fullWidth
                onPress={onClose}
              />
            </>
          )}
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
    gap: Spacing.md,
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
  title: {
    marginTop: Spacing.xs,
  },
  subtitle: {
    marginTop: -Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 14,
  },
  errorText: {
    alignSelf: 'flex-start',
    marginTop: -Spacing.xs,
  },
  successText: {
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
});
