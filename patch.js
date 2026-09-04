const fs = require('fs');
let content = fs.readFileSync('app/(main)/calls.tsx', 'utf8');

const regex = /<YStack flex=\{1\} justifyContent="center" paddingVertical="\$1">[\s\S]*?<\/YStack>/;

const newCode = `<YStack flex={1} justifyContent="center" paddingVertical="$1">
                          <XStack alignItems="center" space="$2" marginBottom="$1">
                            <Text fontWeight="bold" fontSize={17} color={type === 'missed' ? '#ef4444' : '#1e293b'} numberOfLines={1}>{name}</Text>
                            {log.isTranslated && (
                              <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#d1fae5' }}>
                                <Text color="#059669" fontSize={9} fontWeight="900" letterSpacing={0.5}>AI</Text>
                              </View>
                            )}
                          </XStack>
                          <XStack alignItems="center" space="$2">
                            {type === 'missed' ? <PhoneMissed size={14} color="#ef4444" /> : type === 'incoming' ? <PhoneIncoming size={14} color="#10b981" /> : <PhoneOutgoing size={14} color="#005eb8" />}
                            <Text color="#64748b" fontSize={14} fontWeight="500">{formatCallTime(log.createdAt)}</Text>
                          </XStack>
                        </YStack>`;

content = content.replace(regex, newCode);
fs.writeFileSync('app/(main)/calls.tsx', content);
console.log('Replaced successfully');
