import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  heading: {
    marginBottom: 32,
  },
  title: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 20,
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
  passwordRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingRight: 14,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 16,
  },
  passwordToggle: {
    color: '#1677ff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 13,
  },
  errorBanner: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fef2f2',
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1677ff',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 28,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#1677ff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default styles;
