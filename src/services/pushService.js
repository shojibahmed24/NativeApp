import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';
import { displayIncomingCall } from './CallKeepService';
import Constants from 'expo-constants';

let Notifications = null;
const isExpoGo = Constants.appOwnership === 'expo';

try {
  if (!isExpoGo || Platform.OS !== 'android') {
    Notifications = require('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;
        if (data && data.type === 'incoming_call' && Platform.OS !== 'ios') {
          displayIncomingCall(data.callId, data.callerName || 'Unknown', data.callerName || 'Caller');
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
  }
} catch (e) {
  console.log('Notifications not available in this environment');
}

export const registerForPushNotificationsAsync = async () => {
  let token;
  let voipToken;

  if (Notifications && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Register for iOS VoIP Push (PushKit)
  if (Platform.OS === 'ios' && !Device.isSimulator) {
    try {
      const VoipPushNotification = require('react-native-voip-push-notification').default;
      VoipPushNotification.addEventListener('register', (token) => {
        console.log('VoIP Push Token:', token);
        const voipToken = token;
        api.request('/users/push-token', { method: 'POST', body: JSON.stringify({ pushToken: voipToken, isVoip: true }) });
      });

      VoipPushNotification.addEventListener('notification', (notification) => {
        const { callId, callerName } = notification;
        displayIncomingCall(callId, callerName || 'Unknown', callerName || 'Caller');
        if (notification.uuid) {
           VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
        }
      });
      
      VoipPushNotification.registerVoipToken();
    } catch (e) {
      console.log('VoIP Push setup failed:', e);
    }
  }

  if (Notifications && Device.isDevice && Platform.OS !== 'web') {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'bfa05d6f-23df-469b-89da-b4a1f33f1190',
      })).data;
      console.log('Expo Push Token:', token);
      
      await api.request('/users/push-token', { method: 'POST', body: JSON.stringify({ pushToken: token, isVoip: false }) });
    } catch (e) {
      console.log('Silent Warning: Error fetching Expo Push Token:', e.message);
    }
  }

  return token;
};
