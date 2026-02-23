import { useState, useCallback } from 'react';
import { View, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text, Card, Avatar, Divider, Button, Input } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { apiGet, apiPut, apiPost } from '@/services/api';
import { Spacing, BorderRadius } from '@/constants/theme';
import { User, ApiError, Transaction } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  client:  'Client',
  partner: 'Voisin-Relais',
  admin:   'Administrateur',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatEarnings(amount: number): string {
  return (Number(amount) || 0).toFixed(2).replace('.', ',') + ' €';
}

// ── ProfileScreen ──────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const isPartner = user?.role === 'partner';

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Earnings (partner) ────────────────────────────────────────────────────
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');

  // ── Payment history (client) ──────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ── Email verification ────────────────────────────────────────────────────
  const [verifyToken, setVerifyToken]     = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError]     = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isPartner) {
        apiGet<{ total_earnings: number }>('/api/payments/earnings')
          .then((d) => setTotalEarnings(d.total_earnings))
          .catch(() => {});
      } else {
        apiGet<{ success: boolean; data: Transaction[] }>('/api/payments')
          .then((d) => setTransactions(d.data ?? []))
          .catch(() => {});
      }
    }, [isPartner])
  );

  // ── Verify email ──────────────────────────────────────────────────────────
  const handleVerifyEmail = useCallback(async () => {
    if (!verifyToken.trim()) {
      setVerifyError('Collez le token reçu par email.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await apiPost('/api/auth/verify-email', { token: verifyToken.trim() });
      setVerifySuccess(true);
      if (user) updateUser({ ...user, verified: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setVerifyError(apiErr.message ?? 'Token invalide ou expiré.');
    } finally {
      setVerifyLoading(false);
    }
  }, [verifyToken, user, updateUser]);

  // ── Payout ────────────────────────────────────────────────────────────────
  const handlePayout = useCallback(async () => {
    setPayoutLoading(true);
    setPayoutMessage('');
    try {
      const data = await apiPost<{ amount: number }>('/api/payments/payout', {});
      setPayoutMessage(`Virement de ${formatEarnings(data.amount)} initié !`);
    } catch (err) {
      const apiErr = err as ApiError;
      setPayoutMessage(apiErr.message ?? 'Impossible de lancer le virement.');
    } finally {
      setPayoutLoading(false);
    }
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleEdit = () => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setPhone(user?.phone ?? '');
    setSaveError('');
    setEditMode(true);
  };

  const handleCancel = () => {
    setSaveError('');
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError('Prénom et nom sont obligatoires.');
      return;
    }
    setSaveLoading(true);
    setSaveError('');
    try {
      const data = await apiPut<{ user: User }>('/api/users/profile', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      updateUser(data.user);
      setEditMode(false);
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text variant="h3">Profil</Text>
        </View>

        {/* ── Avatar + identité ── */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarRow}>
            <Avatar
              name={user ? `${user.first_name} ${user.last_name}` : 'U'}
              size="large"
            />
            <View style={styles.identity}>
              <Text variant="h5" numberOfLines={1}>
                {user ? `${user.first_name} ${user.last_name}` : '—'}
              </Text>
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text variant="caption" style={{ color: colors.primary }}>
                    {ROLE_LABEL[user?.role ?? ''] ?? ''}
                  </Text>
                </View>
                {user?.verified && (
                  <View style={[styles.roleBadge, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                    <Text variant="caption" style={{ color: colors.success, marginLeft: 3 }}>
                      Vérifié
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {user?.created_at && (
            <View style={[styles.memberRow, { borderTopColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
              <Text variant="caption" color="textTertiary" style={{ marginLeft: Spacing.xs }}>
                Membre depuis {formatDate(user.created_at)}
              </Text>
            </View>
          )}
        </Card>

        {/* ── Vérification email ── */}
        {!user?.verified && !verifySuccess && (
          <View style={[styles.verifyBanner, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            {/* Ligne titre */}
            <View style={styles.verifyTitleRow}>
              <View style={[styles.verifyIconWrap, { backgroundColor: colors.warning }]}>
                <Ionicons name="mail-unread-outline" size={14} color="#fff" />
              </View>
              <Text variant="label" style={{ color: colors.warning, flex: 1 }}>
                Email non vérifié
              </Text>
            </View>

            <Text variant="bodySmall" color="textSecondary" style={styles.verifyDesc}>
              Copiez le token depuis les logs du backend et collez-le ci-dessous pour confirmer votre adresse.
            </Text>

            <Input
              value={verifyToken}
              onChangeText={(v) => { setVerifyToken(v); setVerifyError(''); }}
              placeholder="Coller le token ici..."
              autoCapitalize="none"
              autoCorrect={false}
              error={verifyError || undefined}
            />

            <Button
              title="Confirmer mon adresse"
              variant="primary"
              fullWidth
              loading={verifyLoading}
              onPress={handleVerifyEmail}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={16} color="#fff" />}
              style={styles.verifyBtn}
            />
          </View>
        )}

        {verifySuccess && (
          <View style={[styles.verifyBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <View style={styles.verifyTitleRow}>
              <View style={[styles.verifyIconWrap, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Text variant="label" style={{ color: colors.success, flex: 1 }}>
                Adresse email confirmée
              </Text>
            </View>
            <Text variant="bodySmall" color="textSecondary" style={styles.verifyDesc}>
              Votre adresse email a bien été vérifiée.
            </Text>
          </View>
        )}

        {/* ── Gains (partner uniquement) ── */}
        {isPartner && totalEarnings !== null && (
          <Card style={[styles.earningsCard, { backgroundColor: colors.primary }]}>
            <View style={styles.earningsRow}>
              <View>
                <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Total gagné
                </Text>
                <Text variant="h4" style={{ color: '#fff' }}>
                  {formatEarnings(totalEarnings)}
                </Text>
              </View>
              <View style={[styles.earningsIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="wallet-outline" size={26} color="#fff" />
              </View>
            </View>

            {payoutMessage !== '' && (
              <Text
                variant="caption"
                style={{
                  color: payoutMessage.startsWith('Virement') ? 'rgba(255,255,255,0.9)' : '#ffcccc',
                  marginTop: Spacing.sm,
                }}
              >
                {payoutMessage}
              </Text>
            )}

            <Button
              title="Demander un virement"
              variant="primary"
              fullWidth
              loading={payoutLoading}
              onPress={handlePayout}
              leftIcon={<Ionicons name="arrow-up-circle-outline" size={16} color="#fff" />}
              style={{ marginTop: Spacing.md, backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }}
            />
          </Card>
        )}

        {/* ── Informations personnelles ── */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label">Informations personnelles</Text>
            {!editMode && (
              <Pressable onPress={handleEdit} style={styles.editBtn}>
                <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                <Text variant="caption" style={{ color: colors.primary, marginLeft: 3 }}>
                  Modifier
                </Text>
              </Pressable>
            )}
          </View>

          {editMode ? (
            <View style={styles.editForm}>
              <Input
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <Input
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <Input
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="ex : 06 12 34 56 78"
              />
              {saveError !== '' && (
                <Text variant="caption" color="error">{saveError}</Text>
              )}
              <View style={styles.editActions}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={handleCancel}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Enregistrer"
                  variant="primary"
                  loading={saveLoading}
                  onPress={handleSave}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              <InfoRow icon="person-outline"  label="Prénom" value={user?.first_name} colors={colors} />
              <Divider spacing="sm" />
              <InfoRow icon="person-outline"  label="Nom"    value={user?.last_name}  colors={colors} />
              <Divider spacing="sm" />
              <InfoRow icon="call-outline"    label="Tél."   value={user?.phone ?? '—'} colors={colors} />
            </View>
          )}
        </Card>

        {/* ── Préférences ── */}
        <Card variant="outlined" style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Préférences</Text>
          <View style={styles.prefRow}>
            <View style={styles.prefLabel}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={16} color={colors.textSecondary} />
              <Text variant="body" style={{ marginLeft: Spacing.sm }}>Mode sombre</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : colors.backgroundTertiary}
            />
          </View>
        </Card>

        {/* ── Historique paiements (client uniquement) ── */}
        {!isPartner && transactions.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text variant="label" style={styles.sectionTitle}>Paiements</Text>
            {transactions.slice(0, 5).map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <Divider spacing="sm" />}
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: tx.status === 'completed' ? colors.successLight : colors.backgroundSecondary }]}>
                    <Ionicons
                      name={tx.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                      size={15}
                      color={tx.status === 'completed' ? colors.success : colors.textTertiary}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text variant="bodySmall" numberOfLines={1}>Mission #{tx.mission_id.slice(0, 8)}</Text>
                    <Text variant="caption" color="textTertiary">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </Text>
                  </View>
                  <Text variant="label" style={{ color: tx.status === 'completed' ? colors.success : colors.textSecondary }}>
                    {(Number(tx.amount) / 100).toFixed(2).replace('.', ',')} €
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── Déconnexion ── */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.error, backgroundColor: pressed ? colors.errorLight : 'transparent' },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text variant="button" style={{ color: colors.error, marginLeft: Spacing.sm }}>
            Se déconnecter
          </Text>
        </Pressable>

        <Text variant="caption" color="textTertiary" center style={styles.version}>
          Eco-Relais v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, colors }: {
  icon: string; label: string; value?: string; colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={15} color={colors.textTertiary} />
      <Text variant="caption" color="textTertiary" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodySmall" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  // Avatar card
  avatarCard: { marginBottom: Spacing.lg },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  identity: { flex: 1, gap: Spacing.xs },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  // Earnings
  earningsCard: { marginBottom: Spacing.lg },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsIcon: {
    width: 48, height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { marginBottom: Spacing.md },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Info list
  infoList: { gap: Spacing.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: { width: 48 },
  // Edit form
  editForm: { gap: Spacing.sm },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  // Prefs
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Footer
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  version: { marginBottom: Spacing.xl },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  txIcon: {
    width: 30, height: 30,
    borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  verifyBanner: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  verifyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verifyIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyDesc: {
    lineHeight: 18,
  },
  verifyBtn: {
    marginTop: Spacing.xs,
  },
});
