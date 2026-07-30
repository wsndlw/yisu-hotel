import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 14,
  },
  card: {
    padding: 18,
    gap: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hotelName: {
    flex: 1,
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  orderNumber: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
  amount: {
    color: '#f97316',
    fontSize: 22,
    fontWeight: '700',
  },
  notice: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
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
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1677ff',
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#1677ff',
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
  buttonDisabled: {
    opacity: 0.55,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  stateTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});

export default styles;
