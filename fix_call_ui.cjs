const fs = require('fs');
let file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const bottomControlsRegex = /<Animated\.View entering=\{FadeInUp\.delay\(500\)\} style=\{styles\.bottomControls\}>[\s\S]*?<\/Animated\.View>/;

const bottomControlsReplacement = `<Animated.View entering={FadeInUp.delay(500)} style={styles.bottomControls}>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 40, padding: 20, paddingTop: 30, paddingBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5, overflow: 'hidden' }}>
              <YStack space="$6">
                <XStack justifyContent="space-around" alignItems="center">
                  <GlassButton 
                    icon={isMuted ? <MicOff color="#fff" size={24} /> : <Mic color="#fff" size={24} />} 
                    onPress={() => {
                      Platform.OS !== 'web' && Haptics.selectionAsync();
                      setIsMuted(!isMuted);
                    }} 
                    label="Mute"
                    isActive={isMuted}
                    activeColor="rgba(255,255,255,0.25)"
                  />
                  <GlassButton 
                    icon={<Video color="#fff" size={24} />} 
                    onPress={() => {
                      Platform.OS !== 'web' && Haptics.selectionAsync();
                    }} 
                    label="Video"
                    isActive={activeCall?.isVideo}
                    activeColor="rgba(255,255,255,0.25)"
                  />
                  <GlassButton 
                    icon={<Volume2 color="#fff" size={24} />} 
                    onPress={() => {
                      Platform.OS !== 'web' && Haptics.selectionAsync();
                      setIsSpeakerOn(!isSpeakerOn);
                    }} 
                    label="Speaker"
                    isActive={isSpeakerOn}
                    activeColor="rgba(255,255,255,0.25)"
                  />
                </XStack>
                <XStack justifyContent="center" marginTop="$2">
                  <TouchableOpacity onPress={handleEndCall} activeOpacity={0.8}>
                    <Animated.View style={styles.endCallButton}>
                      <PhoneOff color="white" size={32} />
                    </Animated.View>
                  </TouchableOpacity>
                </XStack>
              </YStack>
            </View>
          </Animated.View>`;

content = content.replace(bottomControlsRegex, bottomControlsReplacement);

fs.writeFileSync(file, content);
console.log('Fixed call UI rounded container');
