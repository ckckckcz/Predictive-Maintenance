import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 36,
  },
  onboardingHeader: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  onboardingSkipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
  onboardingVisualContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingImage: {
    width: 350,
    height: 350
  },
  onboardingContentContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 34,
  },
  onboardingDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 16
  },
  onboardingFooter: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  indicatorActive: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803d',
  },
  onboardingBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#15803d',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onboardingBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

