import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  mainScroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  reportScreenHeader: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  reportScreenDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 20,
    marginTop: -8,
    marginBottom: 8,
  },
  notificationsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },
  notificationList: {
    gap: 12,
  },
  notifItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  notifStatusMarker: {
    width: 6,
    alignSelf: 'stretch',
  },
  notifBody: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  notifDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#64748b',
  },
});
