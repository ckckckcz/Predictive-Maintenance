import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  mainScroll: {
    flex: 1,
  },
  reportScreenHeader: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // PROFILE SCREEN
  profileScrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 14,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  profileBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.1,
  },
  settingsGroupCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingsLabelCol: {
    flex: 1,
    paddingRight: Spacing.four,
    gap: 2,
  },
  settingsIconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsTitleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingsDescText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  accountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
