const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Text color=\{task\.done \? '#94a3b8' : '#333'\} style=\{\{ textDecorationLine: task\.done \? 'line-through' : 'none', flex: 1 \}\}>\{task\.title\}<\/Text>/;
const updatedRender = `<Text color={task.done ? '#94a3b8' : '#333'} style={{ textDecorationLine: task.done ? 'line-through' : 'none', flex: 1 }}>{task.title}</Text>
                             {task.price > 0 && (
                                <Text color="#10b981" fontWeight="bold" fontSize={12} style={{ marginLeft: 8 }}>\${task.price}</Text>
                             )}`;

if (content.match(regex)) {
  content = content.replace(regex, updatedRender);
  fs.writeFileSync(file, content);
  console.log('Fixed render for price');
}
