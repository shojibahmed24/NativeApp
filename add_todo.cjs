const fs = require('fs');
let file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateMatch = content.match(/const \[showScheduleOptions, setShowScheduleOptions\] = useState\(false\);/);
if (stateMatch && !content.includes('showTaskModal')) {
    const newStates = `const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('Task List');
  const [taskInputs, setTaskInputs] = useState(['', '', '']);
  
  const toggleTask = async (msgId: string, taskId: string) => {
    Platform.OS !== 'web' && Haptics.impactAsync();
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.metadata) return;
    const newTasks = msg.metadata.tasks.map((t: any) => t.id === taskId ? { ...t, done: !t.done } : t);
    const newMetadata = { ...msg.metadata, tasks: newTasks };
    updateMessageLocally(id as string, msgId, { metadata: newMetadata });
    try {
      await api.updateMessageMetadata(msgId, newMetadata);
    } catch(e) { console.error(e); }
  };
  
  const sendTaskList = () => {
    const validTasks = taskInputs.filter(t => t.trim() !== '').map((t, i) => ({ id: \`t\${i}_\${Date.now()}\`, title: t.trim(), done: false }));
    if (validTasks.length === 0) return alert('Please enter at least one task');
    sendMessage(id as string, '', 'todo_list', undefined, replyingTo?.id, undefined, undefined, { title: taskTitle, tasks: validTasks });
    setShowTaskModal(false);
    setTaskInputs(['', '', '']);
    setTaskTitle('Task List');
    setReplyingTo(null);
  };
  `;
    content = content.replace(stateMatch[0], newStates);
}

// 2. Add To-Do option in attachment menu
const galleryOpt = `<Text fontSize={12} color="#666">Gallery</Text>
                </TouchableOpacity>`;
const todoOpt = `${galleryOpt}
                
                <TouchableOpacity onPress={() => { setShowTaskModal(true); setShowScheduleOptions(false); }} style={{ alignItems: 'center' }}>
                  <View style={{ padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 24, marginBottom: 8 }}>
                    <CheckSquare color="#3b82f6" size={28} />
                  </View>
                  <Text fontSize={12} color="#666">To-Do</Text>
                </TouchableOpacity>`;
if (!content.includes('>To-Do<')) {
    content = content.replace(galleryOpt, todoOpt);
}

// 3. Render todo_list
const moneyReq = `<Text color="white" fontWeight="bold">Pay Now</Text>}
                    </TouchableOpacity>
                  </View>
                )}`;
const todoRender = `${moneyReq}
                {(msg.type === 'todo_list' || msg.mediaType === 'todo_list') && msg.metadata?.tasks && (
                  <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, minWidth: 260, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                    <XStack alignItems="center" marginBottom="$3">
                       <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: 20, marginRight: 8 }}>
                         <CheckSquare color="#3b82f6" size={20} />
                       </View>
                       <YStack flex={1}>
                         <Text color="#333" fontWeight="bold" fontSize={16}>{msg.metadata.title || 'Task List'}</Text>
                         <Text color="#666" fontSize={12}>{msg.metadata.tasks.filter((t:any) => t.done).length} of {msg.metadata.tasks.length} completed</Text>
                       </YStack>
                    </XStack>
                    
                    <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: \`\${(msg.metadata.tasks.filter((t:any) => t.done).length / (msg.metadata.tasks.length||1)) * 100}%\`, backgroundColor: '#3b82f6', borderRadius: 3 }} />
                    </View>
                
                    <YStack space="$2">
                      {msg.metadata.tasks.map((task: any, index: number) => (
                        <TouchableOpacity key={task.id} onPress={() => toggleTask(msg.id, task.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                           <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: task.done ? '#3b82f6' : '#cbd5e1', backgroundColor: task.done ? '#3b82f6' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              {task.done && <Check color="#fff" size={14} strokeWidth={3} />}
                           </View>
                           <Text color={task.done ? '#94a3b8' : '#333'} style={{ textDecorationLine: task.done ? 'line-through' : 'none', flex: 1 }}>{task.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </YStack>
                  </View>
                )}`;
if (!content.includes("msg.type === 'todo_list'")) {
    content = content.replace(moneyReq, todoRender);
}

// 4. Modal UI at the end
const endTag = `</SafeAreaView>
    </GradientBackground>
  );
}`;
const modalUI = `
      {/* Task Creator Modal */}
      <Modal visible={showTaskModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <Text fontSize={20} fontWeight="bold" color="#333">Create To-Do List</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}><X color="#999" size={24} /></TouchableOpacity>
            </XStack>
            
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="List Title (e.g., UI Design Tasks)"
              style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16, fontWeight: 'bold' }}
              placeholderTextColor="#94a3b8"
            />
            
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <YStack space="$3" marginBottom="$4">
                {taskInputs.map((val, idx) => (
                  <XStack key={idx} alignItems="center">
                    <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 10 }} />
                    <TextInput
                      value={val}
                      onChangeText={(v) => { const newIns = [...taskInputs]; newIns[idx] = v; setTaskInputs(newIns); }}
                      placeholder={\`Task \${idx + 1}\`}
                      style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 10, fontSize: 16 }}
                    />
                    {taskInputs.length > 1 && (
                      <TouchableOpacity onPress={() => { const newIns = taskInputs.filter((_, i) => i !== idx); setTaskInputs(newIns); }}>
                        <X color="#ef4444" size={20} style={{ marginLeft: 10 }} />
                      </TouchableOpacity>
                    )}
                  </XStack>
                ))}
              </YStack>
            </ScrollView>
            
            <TouchableOpacity onPress={() => setTaskInputs([...taskInputs, ''])} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingVertical: 10 }}>
              <PlusCircle color="#3b82f6" size={20} style={{ marginRight: 8 }} />
              <Text color="#3b82f6" fontWeight="bold">Add another task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={sendTaskList} style={{ backgroundColor: '#005eb8', padding: 16, borderRadius: 16, alignItems: 'center' }}>
              <Text color="#fff" fontWeight="bold" fontSize={16}>Send Task List</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      ${endTag}`;
if (!content.includes('Task Creator Modal')) {
    content = content.replace(endTag, modalUI);
}

fs.writeFileSync(file, content);
console.log('Task Modal and Todo Renderer added');
