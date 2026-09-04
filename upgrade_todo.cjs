const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const targetModal = `<ScrollView style={{ maxHeight: 300 }}>
                {taskInputs.map((t, i) => (
                  <XStack key={i} alignItems="center" marginBottom="$3">
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', marginRight: 12 }} />
                    <TextInput 
                      value={t}
                      onChangeText={(val) => {
                        const newInputs = [...taskInputs];
                        newInputs[i] = val;
                        if (i === taskInputs.length - 1 && val !== '') {
                          newInputs.push('');
                        }
                        setTaskInputs(newInputs);
                      }}
                      placeholder="Add a task..."
                      style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 }}
                    />
                  </XStack>
                ))}
              </ScrollView>`;

const updatedModal = `<ScrollView style={{ maxHeight: 300 }}>
                {taskInputs.map((t, i) => (
                  <XStack key={i} alignItems="center" marginBottom="$3">
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', marginRight: 12 }} />
                    <TextInput 
                      value={typeof t === 'string' ? t : t.title}
                      onChangeText={(val) => {
                        const newInputs = [...taskInputs];
                        newInputs[i] = typeof t === 'string' ? { title: val, price: '' } : { ...t, title: val };
                        if (i === taskInputs.length - 1 && val !== '') {
                          newInputs.push('');
                        }
                        setTaskInputs(newInputs);
                      }}
                      placeholder="Add a task..."
                      style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 }}
                    />
                    <TextInput 
                      value={typeof t === 'string' ? '' : t.price}
                      onChangeText={(val) => {
                        const newInputs = [...taskInputs];
                        if (typeof t === 'string') {
                            newInputs[i] = { title: t, price: val };
                        } else {
                            newInputs[i] = { ...t, price: val };
                        }
                        setTaskInputs(newInputs);
                      }}
                      placeholder="$0.00"
                      keyboardType="numeric"
                      style={{ width: 60, marginLeft: 10, backgroundColor: '#f0f4f8', padding: 8, borderRadius: 8, textAlign: 'center' }}
                    />
                  </XStack>
                ))}
              </ScrollView>`;

content = content.replace(targetModal, updatedModal);

const targetSend = `const validTasks = taskInputs.filter(t => t.trim() !== '').map((t, i) => ({ id: \`t\${i}_\${Date.now()}\`, title: \nt.trim(), done: false }));`;
const updatedSend = `const validTasks = taskInputs.filter(t => (typeof t === 'string' ? t : t.title).trim() !== '').map((t, i) => ({ id: \`t\${i}_\${Date.now()}\`, title: (typeof t === 'string' ? t : t.title).trim(), price: typeof t === 'string' ? 0 : parseFloat(t.price || '0'), done: false }));`;

content = content.replace(targetSend, updatedSend);

const targetRender = `<Text color={task.done ? '#94a3b8' : '#333'} style={{ textDecorationLine: task.done ? \n'line-through' : 'none', flex: 1 }}>{task.title}</Text>`;
const updatedRender = `<Text color={task.done ? '#94a3b8' : '#333'} style={{ textDecorationLine: task.done ? 'line-through' : 'none', flex: 1 }}>{task.title}</Text>
                             {task.price > 0 && (
                                <Text color="#10b981" fontWeight="bold" fontSize={12} style={{ marginLeft: 8 }}>\${task.price}</Text>
                             )}`;
                             
content = content.replace(targetRender, updatedRender);

fs.writeFileSync(file, content);
console.log('Added price to To-Do');
