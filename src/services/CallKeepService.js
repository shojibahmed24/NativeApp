
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let CallKeep = null;
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    CallKeep = require('react-native-callkeep').default;
  } catch (e) {
    console.log('CallKeep not available');
  }
}

export const setupCallKeep = () => {
  if (!CallKeep || !CallKeep.setup) return;
  const options = {
    ios: {
      appName: 'UNICOM',
      includesCallsInRecents: true,
    },
    android: {
      alertTitle: 'Permissions required',
      alertDescription: 'This application needs to access your phone accounts',
      cancelButton: 'Cancel',
      okButton: 'ok',
      imageName: 'phone_account_icon',
      additionalPermissions: [],
      foregroundService: {
        channelId: 'unicom_calls',
        channelName: 'Foreground service for UNICOM calls',
        notificationTitle: 'UNICOM is running in background',
        notificationIcon: 'Path to the resource icon of the notification',
      },
    },
  };

  try {
    CallKeep.setup(options).then(accepted => {});
    if (CallKeep.setAvailable) CallKeep.setAvailable(true);
  } catch (err) {
    console.log('CallKeep setup skipped:', err.message);
  }
};

export const displayIncomingCall = (uuid, handle, localizedCallerName) => {
  if (!CallKeep || !CallKeep.displayIncomingCall) return;
  try {
    CallKeep.displayIncomingCall(uuid, handle, localizedCallerName, 'number', false);
  } catch (e) {}
};

export const endCall = (uuid) => {
  if (!CallKeep || !CallKeep.endCall) return;
  try {
    CallKeep.endCall(uuid);
  } catch (e) {}
};
