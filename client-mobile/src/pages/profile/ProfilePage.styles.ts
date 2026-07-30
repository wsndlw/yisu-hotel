import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: '#e8f1ff',
  },
  avatarText: {
    color: '#1677ff',
    fontSize: 28,
    fontWeight: '700',
  },
  username: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
  },
  roleText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    gap: 12,
    borderRadius: 14,
    padding: 18,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    color: '#6b7280',
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    textAlign: 'right',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: '#1677ff',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
