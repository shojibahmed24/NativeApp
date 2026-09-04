const fs = require('fs');
let file = 'app/(main)/my-profile.tsx';
let content = fs.readFileSync(file, 'utf8');

const blockedRegex = /<TouchableOpacity\s*onPress=\{\(\) => setShowBlockedList\(!showBlockedList\)\}\s*style=\{\[styles\.settingRow, styles\.settingRowBorder\]\}\s*>/;

const blockedReplacement = `<TouchableOpacity
                  onPress={() => setShowBlockedList(!showBlockedList)}
                  style={styles.settingRow}
                >
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View style={[styles.settingIcon, { backgroundColor: '#fff1f2' }]}>
                      <ShieldBan color="#ef4444" size={20} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#cbd5e1' }}>
                      <YStack flex={1}>
                        <Text fontWeight="600" fontSize={16} color="#0f172a">Blocked Users</Text>
                        <Text fontSize={13} color="#64748b" marginTop={2}>{blockedUsers.length} blocked</Text>
                      </YStack>
                      {showBlockedList ? <ChevronUp color="#cbd5e1" size={20} /> : <ChevronDown color="#cbd5e1" size={20} />}
                    </View>
                  </XStack>
                </TouchableOpacity>
                {/* Ignore old structure */}`;

// Actually let's just replace the exact blocked users TouchableOpacity block
const exactBlockedRegex = /<TouchableOpacity\s*onPress=\{\(\) => setShowBlockedList\(!showBlockedList\)\}\s*style=\{\[styles\.settingRow, styles\.settingRowBorder\]\}\s*>[\s\S]*?<XStack alignItems="center" space="\$3" flex=\{1\}>[\s\S]*?<View style=\{\[styles\.settingIcon, \{ backgroundColor: '#fff1f2' \}\]\}>[\s\S]*?<ShieldBan color="#ef4444" size=\{20\} \/>[\s\S]*?<\/View>[\s\S]*?<YStack flex=\{1\}>[\s\S]*?<Text fontWeight="600" fontSize=\{15\} color="#0f172a">Blocked Users<\/Text>[\s\S]*?<Text fontSize=\{12\} color="#94a3b8" marginTop=\{2\}>\{blockedUsers\.length\} blocked<\/Text>[\s\S]*?<\/YStack>[\s\S]*?\{showBlockedList \? <ChevronUp color="#cbd5e1" size=\{18\} \/> : <ChevronDown color="#cbd5e1" size=\{18\} \/>\}[\s\S]*?<\/XStack>[\s\S]*?<\/TouchableOpacity>/;

content = content.replace(exactBlockedRegex, `<TouchableOpacity
                  onPress={() => setShowBlockedList(!showBlockedList)}
                  style={styles.settingRow}
                >
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View style={[styles.settingIcon, { backgroundColor: '#fff1f2' }]}>
                      <ShieldBan color="#ef4444" size={20} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#cbd5e1' }}>
                      <YStack flex={1}>
                        <Text fontWeight="600" fontSize={16} color="#0f172a">Blocked Users</Text>
                        <Text fontSize={13} color="#64748b" marginTop={2}>{blockedUsers.length} blocked</Text>
                      </YStack>
                      {showBlockedList ? <ChevronUp color="#cbd5e1" size={20} /> : <ChevronDown color="#cbd5e1" size={20} />}
                    </View>
                  </XStack>
                </TouchableOpacity>`);

fs.writeFileSync(file, content);
console.log('Fixed blocked users layout');
