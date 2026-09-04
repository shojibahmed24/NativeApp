const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const recordingRegex = /<TouchableOpacity onPress=\{startRecording\}[\s\S]*?<Mic color="#888" size=\{20\} \/>[\s\S]*?<\/TouchableOpacity>/;

const recordingReplacement = `<TouchableOpacity 
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
            >
              <Animated.View style={{ 
                width: 45, height: 45, borderRadius: 22.5, 
                backgroundColor: isRecording ? '#ef4444' : '#f1f5f9', 
                alignItems: 'center', justifyContent: 'center',
                shadowColor: isRecording ? '#ef4444' : 'transparent',
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: isRecording ? 5 : 0
              }}>
                <Mic color={isRecording ? "#fff" : "#64748b"} size={22} />
              </Animated.View>
            </TouchableOpacity>`;

content = content.replace(recordingRegex, recordingReplacement);

// Also replace the old stopRecording button (which was conditionally rendered)
const oldStopRegex = /<TouchableOpacity onPress=\{stopRecording\}[\s\S]*?<View style=\{\{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' \}\}>[\s\S]*?<Square color="#fff" size=\{16\} \/>[\s\S]*?<\/View>[\s\S]*?<\/TouchableOpacity>/;
if(content.match(oldStopRegex)) {
   content = content.replace(oldStopRegex, '');
}

fs.writeFileSync(file, content);
console.log('Fixed chat layout 2 (Voice wave animation placeholder)');
