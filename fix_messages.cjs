const fs = require('fs');
let file = 'app/(main)/messages.tsx';
let content = fs.readFileSync(file, 'utf8');

const loadingRegex = /if \(loading\) \{[\s\S]*?return \([\s\S]*?<View style=\{styles\.loadingContainer\}>[\s\S]*?<ActivityIndicator color="#005eb8" size="large" \/>[\s\S]*?<Text color="#94a3b8" marginTop="\$3">Loading chats\.\.\.<\/Text>[\s\S]*?<\/View>[\s\S]*?\);[\s\S]*?\}/;

const loadingReplacement = `if (loading) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text fontSize={28} fontWeight="900" color="#005eb8" letterSpacing={-0.5}>UniCom</Text>
          </View>
          <View style={styles.searchContainer}>
            <View style={{width: '100%', height: 20, backgroundColor: '#f1f5f9', borderRadius: 10}} />
          </View>
          <View style={{flex: 1}}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 50)} style={[styles.chatRow, styles.chatRowBorder]}>
                <View style={[styles.avatar, {backgroundColor: '#f1f5f9'}]} />
                <YStack flex={1} marginLeft="$3" space="$2" justifyContent="center">
                  <View style={{width: '50%', height: 16, backgroundColor: '#f1f5f9', borderRadius: 8}} />
                  <View style={{width: '80%', height: 14, backgroundColor: '#f8fafc', borderRadius: 7}} />
                </YStack>
              </Animated.View>
            ))}
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }`;

content = content.replace(loadingRegex, loadingReplacement);

// Update unread badge style
content = content.replace(
  /unreadBadge: \{ backgroundColor: '#005eb8', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center', marginLeft: 6 \}/,
  "unreadBadge: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 6, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 6, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }"
);

// Empty state update
const emptyStateRegex = /<View style=\{styles\.emptyIcon\}>[\s\S]*?<MessageSquare color="#94a3b8" size=\{36\} \/>[\s\S]*?<\/View>[\s\S]*?<Text fontSize=\{18\} fontWeight="700" color="#0f172a" marginTop="\$4">[\s\S]*?\{search \? 'No results found' : 'No conversations yet'\}[\s\S]*?<\/Text>[\s\S]*?<Text fontSize=\{14\} color="#94a3b8" marginTop="\$2" textAlign="center">[\s\S]*?\{search \? \`No chats matching "\$\{search\}"\` : 'Start a chat from the Contacts tab'\}[\s\S]*?<\/Text>/;

const emptyStateReplacement = `<View style={[styles.emptyIcon, { backgroundColor: '#eff6ff', shadowColor: '#005eb8', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 }]}>
              <MessageSquare color="#005eb8" size={42} strokeWidth={1.5} />
            </View>
            <Text fontSize={22} fontWeight="800" color="#0f172a" marginTop="$5">
              {search ? 'No results found' : 'No messages yet'}
            </Text>
            <Text fontSize={15} color="#64748b" marginTop="$2" textAlign="center" paddingHorizontal="$4" lineHeight={22}>
              {search ? \`We couldn't find any chats matching "\${search}"\` : 'Your inbox is empty. Start a new conversation and experience seamless translation!'}
            </Text>`;

content = content.replace(emptyStateRegex, emptyStateReplacement);

fs.writeFileSync(file, content);
console.log('Fixed messages.tsx');
