const fs = require('fs');
let file = 'app/(main)/my-profile.tsx';
let content = fs.readFileSync(file, 'utf8');

const settingRowRegex = /<View style=\{\[styles\.settingRow, !isLast && styles\.settingRowBorder\]\}>[\s\S]*?<XStack alignItems="center" space="\$3" flex=\{1\}>[\s\S]*?<View style=\{\[styles\.settingIcon, \{ backgroundColor: iconBg \}\]\}>[\s\S]*?\{React\.cloneElement\(icon, \{ color: iconColor, size: 20 \}\)\}[\s\S]*?<\/View>[\s\S]*?<YStack flex=\{1\}>[\s\S]*?<Text fontWeight="600" fontSize=\{15\} color="#0f172a">\{label\}<\/Text>[\s\S]*?\{subtitle && <Text fontSize=\{12\} color="#94a3b8" marginTop=\{2\}>\{subtitle\}<\/Text>\}[\s\S]*?<\/YStack>[\s\S]*?<\/XStack>[\s\S]*?\{rightElement \?\? \(onPress \? <ChevronRight color="#cbd5e1" size=\{18\} \/> : null\)\}[\s\S]*?<\/View>/;

const settingRowReplacement = `<View style={styles.settingRow}>
        <XStack alignItems="center" space="$3" flex={1}>
          <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
            {React.cloneElement(icon, { color: iconColor, size: 20 })}
          </View>
          <View style={[ { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: '#cbd5e1' } ]}>
            <YStack flex={1}>
              <Text fontWeight="600" fontSize={16} color="#0f172a">{label}</Text>
              {subtitle && <Text fontSize={13} color="#64748b" marginTop={2}>{subtitle}</Text>}
            </YStack>
            {rightElement ?? (onPress ? <ChevronRight color="#cbd5e1" size={20} /> : null)}
          </View>
        </XStack>
      </View>`;

content = content.replace(settingRowRegex, settingRowReplacement);

// Remove paddingVertical from settingRow base style so the inner View handles it
content = content.replace(/settingRow: \{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#fff' \}/, "settingRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16, backgroundColor: '#fff' }");


fs.writeFileSync(file, content);
console.log('Fixed profile SettingRow');
