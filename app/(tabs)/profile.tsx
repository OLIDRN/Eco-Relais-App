import { StyleSheet, View, Pressable, Switch } from 'react-native';
import { ScreenContainer, Text, Card, Avatar, Divider } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useTheme } from '@/contexts/theme-context';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { label: 'Informations personnelles', icon: 'person' },
    { label: 'Adresses enregistrées', icon: 'location' },
    { label: 'Moyens de paiement', icon: 'card' },
    { label: 'Notifications', icon: 'bell' },
    { label: 'Aide et support', icon: 'help' },
  ];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="h3">Profil</Text>
      </View>

      {/* User Card */}
      <Card style={styles.userCard}>
        <View style={styles.userInfo}>
          <Avatar name="Utilisateur" size="large" />
          <View style={styles.userDetails}>
            <Text variant="h5">Connectez-vous</Text>
            <Text variant="bodySmall" color="textSecondary">
              Pour accéder à toutes les fonctionnalités
            </Text>
          </View>
        </View>
      </Card>

      {/* Theme Toggle */}
      <Card variant="outlined" style={styles.themeCard}>
        <View style={styles.themeRow}>
          <View>
            <Text variant="body">Mode sombre</Text>
            <Text variant="caption" color="textSecondary">
              {isDark ? 'Activé' : 'Désactivé'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.border,
              true: colors.primaryLight
            }}
            thumbColor={isDark ? colors.primary : colors.backgroundTertiary}
          />
        </View>
      </Card>

      {/* Menu Items */}
      <Card variant="outlined" style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <View key={item.label}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text variant="body">{item.label}</Text>
              <Text variant="body" color="textTertiary">→</Text>
            </Pressable>
            {index < menuItems.length - 1 && <Divider spacing="none" />}
          </View>
        ))}
      </Card>

      {/* Version */}
      <Text variant="caption" color="textTertiary" center style={styles.version}>
        Eco-Relais v1.0.0
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  userCard: {
    marginBottom: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  themeCard: {
    marginBottom: Spacing.lg,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  version: {
    marginTop: Spacing['2xl'],
  },
});
