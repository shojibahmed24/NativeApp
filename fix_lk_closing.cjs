const fs = require('fs');
const file = 'app/call/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<\/View>\s*<\/Animated\.View>\s*<\/YStack>\s*<\/View>\s*\);\s*\}/s;
const replacement = `          </View>
        </Animated.View>
        </YStack>
    </View>
    </LiveKitWrapper>
  );
}`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Fixed LiveKitWrapper closing tag');
} else {
  console.log('Regex failed');
}
