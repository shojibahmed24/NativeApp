import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { YStack, XStack, Text, Avatar } from 'tamagui';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import { useCall } from '../context/CallContext';
import { useRouter } from 'expo-router';

export default function IncomingCallModal() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();
  const router = useRouter();

  if (!incomingCall) return null;

  const handleAccept = async () => {
    await acceptIncomingCall();
    router.push(`/call/${incomingCall.callId}`);
  };

  const handleReject = () => {
    rejectIncomingCall();
  };

  return (
    <Modal visible={!!incomingCall} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Avatar circular size="$10" marginBottom="$4">
            {incomingCall.caller?.avatar && <Avatar.Image src={incomingCall.caller.avatar} />}
            <Avatar.Fallback backgroundColor="$blue5" justifyContent="center" alignItems="center">
              <Text color="white" fontSize="$7" fontWeight="bold">
                {(incomingCall.caller?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          
          <Text fontSize={24} fontWeight="bold" color="#fff" marginBottom="$2">
            {incomingCall.caller?.name || 'Unknown Caller'}
          </Text>
          
          <Text fontSize={16} color="rgba(255,255,255,0.7)" marginBottom="$6">
            Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
          </Text>

          {incomingCall.isTranslated && (
            <View style={styles.aiBadge}>
              <Text color="#059669" fontSize={12} fontWeight="bold">AI Translated Call</Text>
            </View>
          )}

          <XStack space="$8" marginTop="$4">
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
              <PhoneOff color="#fff" size={32} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
              {incomingCall.isVideo ? <Video color="#fff" size={32} /> : <Phone color="#fff" size={32} />}
            </TouchableOpacity>
          </XStack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    width: Dimensions.get('window').width * 0.85,
    alignItems: 'center',
    padding: 30,
    borderRadius: 20
  },
  btn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#10b981',
  },
  aiBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20
  }
});
