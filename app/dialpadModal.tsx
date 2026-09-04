import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text, H1, H4 } from 'tamagui';
import { Phone, Delete } from 'lucide-react-native';
import { GradientBackground, GlassCard } from '../src/components/ThemeComponents';
import { useRouter } from 'expo-router';
import { useCall } from '../src/context/CallContext';
import { api } from '../src/services/api';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export default function DialpadModal() {
  const router = useRouter();
  const { startVoiceCall } = useCall();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState('');

  const handleLongPress = (num: string) => {
    if (num === '0') {
      setError('');
      setPhoneNumber(prev => prev + '+');
    }
  };

  const handlePress = (num: string) => {
    setError('');
    setPhoneNumber(prev => prev + num);
  };

  const handleDelete = () => {
    setError('');
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber) return;
    
    setIsCalling(true);
    setError('');
    
    try {
      // Normalize phone number (assume +880 default for Bangladesh if not specified)
      let normalized = phoneNumber;
      if (!normalized.startsWith('+')) {
        if (normalized.startsWith('01')) {
          normalized = '+88' + normalized;
        } else if (normalized.startsWith('880')) {
          normalized = '+' + normalized;
        } else {
          normalized = '+' + normalized;
        }
      }

      // Look up user by phone
      const res = await api.syncContacts([normalized]);
      if (res.contacts && res.contacts.length > 0) {
        const peer = res.contacts[0];
        const callRes = await startVoiceCall(peer);
        router.replace(`/call/${callRes.call.id}`);
      } else {
        setError('User not found with this number');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate call');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <GradientBackground padding="$6" paddingTop="$10">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$10">
        <TouchableOpacity onPress={() => { if(router.canGoBack()) router.back(); else router.push('/(main)/calls'); }} style={{ padding: 10, margin: -10 }}><Text color="#005eb8" fontSize="$5">Cancel</Text></TouchableOpacity>
        <H4 fontWeight="bold">Dialpad</H4>
        <Text width={50}></Text>
      </XStack>

      <YStack alignItems="center" marginBottom="$10" minHeight={60}>
        <H1 color="#0080ff" fontSize={48} fontWeight="300" letterSpacing={2}>
          {phoneNumber || ' '}
        </H1>
        {error ? <Text color="#ef4444" marginTop="$2">{error}</Text> : null}
      </YStack>

      <GlassCard flex={1} padding="$6">
        <YStack gap="$4" justifyContent="space-between" flex={1}>
          <XStack justifyContent="space-between">
            <DialButton number="1" letters="" onPress={() => handlePress('1')} />
            <DialButton number="2" letters="ABC" onPress={() => handlePress('2')} />
            <DialButton number="3" letters="DEF" onPress={() => handlePress('3')} />
          </XStack>
          <XStack justifyContent="space-between">
            <DialButton number="4" letters="GHI" onPress={() => handlePress('4')} />
            <DialButton number="5" letters="JKL" onPress={() => handlePress('5')} />
            <DialButton number="6" letters="MNO" onPress={() => handlePress('6')} />
          </XStack>
          <XStack justifyContent="space-between">
            <DialButton number="7" letters="PQRS" onPress={() => handlePress('7')} />
            <DialButton number="8" letters="TUV" onPress={() => handlePress('8')} />
            <DialButton number="9" letters="WXYZ" onPress={() => handlePress('9')} />
          </XStack>
          <XStack justifyContent="space-between">
            <DialButton number="*" letters="" onPress={() => handlePress('*')} />
            <DialButton number="0" letters="+" onPress={() => handlePress('0')} onLongPress={() => handleLongPress('0')} />
            <DialButton number="#" letters="" onPress={() => handlePress('#')} />
          </XStack>
          
          <XStack justifyContent="space-between" alignItems="center" marginTop="$4">
            <Text width={70}></Text>
            
            <TouchableOpacity onPress={handleCall} disabled={isCalling || !phoneNumber}>
              <YStack
                backgroundColor={isCalling || !phoneNumber ? "#94a3b8" : "#0080ff"}
                width={70}
                height={70}
                borderRadius={35}
                justifyContent="center"
                alignItems="center"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.2}
                shadowRadius={5}
              >
                {isCalling ? <ActivityIndicator color="#fff" /> : <Phone color="white" size={32} />}
              </YStack>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleDelete} disabled={!phoneNumber}>
              <YStack width={70} alignItems="center">
                <Delete color={phoneNumber ? "#888" : "transparent"} size={24} />
              </YStack>
            </TouchableOpacity>
          </XStack>
        </YStack>
      </GlassCard>
    </GradientBackground>
  );
}

const DialButton = ({ number, letters, onPress, onLongPress }: { number: string; letters: string; onPress: () => void; onLongPress?: () => void }) => (
  <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
    <YStack width={70} height={70} alignItems="center" justifyContent="center" backgroundColor="rgba(0,0,0,0.02)" borderRadius={35}>
      <Text color="#0f172a" fontSize={36} fontWeight="300" lineHeight={40}>{number}</Text>
      <Text color="#64748b" fontSize={10} fontWeight="bold" letterSpacing={1}>{letters}</Text>
    </YStack>
  </TouchableOpacity>
);
