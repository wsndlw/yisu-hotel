import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sessionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 18,
    gap: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  successCard: {
    padding: 20,
    gap: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  successTitle: {
    color: '#15803d',
    fontSize: 24,
    fontWeight: '700',
  },
  orderNumber: {
    color: '#374151',
    fontSize: 13,
  },
  hotelName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  detailText: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  priceText: {
    color: '#f97316',
    fontSize: 20,
    fontWeight: '700',
  },
  snapshotText: {
    color: '#64748b',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  noticeText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 13,
  },
  errorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1677ff',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  standaloneButton: {
    flex: 0,
    alignSelf: 'stretch',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1677ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#1677ff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default styles;
