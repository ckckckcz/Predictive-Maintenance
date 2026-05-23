import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  loginBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginLogo: {
    width: 150,
    height: 50,
  },
  loginBrandTextContainer: {
    flexDirection: 'column',
  },
  loginBrandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  loginBrandSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 18,
  },
  welcomeContainer: {
    marginBottom: 36,
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  inputsContainer: {
    gap: 20,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  eyeButton: {
    paddingLeft: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  loginSubmitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loginSubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginFooter: {
    alignItems: 'center',
    marginTop: 12,
  },
  loginFooterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});
