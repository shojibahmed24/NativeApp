
import { Platform } from 'react-native';

let CallKeep = null;
if (Platform.OS !== 'web') {
  try {
    CallKeep = require('react-native-callkeep').default;
  } catch (e) {
    console.log('CallKeep not available');
  }
}

export const setupCallKeep = () => {
  if (!CallKeep) return;
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
    CallKeep.setAvailable(true);
  } catch (err) {
    console.error('CallKeep setup error:', err);
  }
};

export const displayIncomingCall = (uuid, handle, localizedCallerName) => {
  if (!CallKeep) return;
  CallKeep.displayIncomingCall(uuid, handle, localizedCallerName, 'number', false);
};

export const endCall = (uuid) => {
  if (!CallKeep) return;
  CallKeep.endCall(uuid);
};
