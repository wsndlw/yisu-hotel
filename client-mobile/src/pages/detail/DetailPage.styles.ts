import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  stickyHeader: {
    zIndex: 12,
  },
  controlsSurface: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  stateText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryStateButton: {
    minWidth: 132,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1677ff',
  },
  primaryStateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryStateButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryStateButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});

export default styles;
