const fs = require('fs');
const file = 'app/chat/[id].tsx';
let content = fs.readFileSync(file, 'utf8');

const modalCode = `
      {/* Task Creator Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="bold">Create To-Do List</Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <Text color="#666" fontSize={24}>×</Text>
                </TouchableOpacity>
              </XStack>
              
              <TextInput 
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="List Title (e.g. Website Features)"
                style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 12, marginBottom: 16, fontWeight: 'bold' }}
              />
              
              <ScrollView style={{ maxHeight: 300 }}>
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
              </ScrollView>
              
              <TouchableOpacity onPress={sendTaskList} style={{ backgroundColor: '#005eb8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
                <Text color="#fff" fontWeight="bold">Send List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
`;

if (!content.includes('Task Creator Modal')) {
  content = content.replace(/\{renderMoneyRequestModal\(\)\}/, '{renderMoneyRequestModal()}\n' + modalCode);
  fs.writeFileSync(file, content);
}
console.log('Injected TaskCreatorModal');
