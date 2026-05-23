import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  mainScroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileScrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 48,
  },
  profileScreenHeader: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  // Main card
  profileCard: {
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    padding: 20,
    marginBottom: 16,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#f8fafc',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editPhotoBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  editPhotoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 16,
  },
  profileNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  profileEmailText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  // Side-by-side cards
  sideCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  sideCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  sideCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sideCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  // List settings
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 16,
  },
  settingsList: {
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notifIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabelCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  settingsTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  settingsDescText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  accountValText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fef2f2',
    backgroundColor: '#fff5f5',
    marginTop: 12,
    marginBottom: 24,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
});
