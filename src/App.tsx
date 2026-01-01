import { useState, useEffect } from 'react';
import { supabase, Task } from './lib/supabase';
import { Plus, Trash2, Edit2, Check, X, Calendar, Flag, LogOut } from 'lucide-react';
import { AuthForm } from './components/AuthForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const, due_date: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        fetchTasks(session.user.id);
      } else {
        setUserId(null);
        setUserEmail('');
        setTasks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      fetchTasks(session.user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchTasks = async (uid: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !userId) {
      alert('Por favor ingresa un título para la tarea');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          user_id: userId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        alert('Error al agregar la tarea: ' + error.message);
        return;
      }

      if (data) {
        setTasks([data, ...tasks]);
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Ocurrió un error inesperado');
    }
  };

  const toggleComplete = async (task: Task) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed, updated_at: new Date().toISOString() })
      .eq('id', task.id)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === task.id ? data : t));
    }
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingTask.id)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === data.id ? data : t));
      setEditingTask(null);
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    high: 'bg-red-100 text-red-700 border-red-300'
  };

  const priorityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  };

  if (!userId) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-white">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-pink-400 text-8xl">🎀</div>
        <div className="absolute top-32 right-20 text-pink-400 text-6xl">💕</div>
        <div className="absolute bottom-20 left-32 text-pink-400 text-7xl">🌸</div>
        <div className="absolute bottom-40 right-40 text-pink-400 text-6xl">✨</div>
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSignOut}
            className="bg-white border-2 border-pink-200 hover:border-pink-400 text-pink-500 px-6 py-2 rounded-2xl font-semibold flex items-center gap-2 transition-all hover:shadow-lg"
          >
            <LogOut size={18} />
            Cerrar Sesion
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex justify-center">
              <img
                src="https://images.pexels.com/photos/1128573/pexels-photo-1128573.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop"
                alt="Flores rosas"
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            </div>
            <div className="flex justify-center">
              <img
                src="https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop"
                alt="Decoración kawaii"
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            </div>
            <div className="flex justify-center">
              <img
                src="https://images.pexels.com/photos/1833080/pexels-photo-1833080.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop"
                alt="Rosa romántica"
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl">🎀</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
              Mi Agenda Kawaii
            </h1>
            <div className="text-6xl">💖</div>
          </div>
          <p className="text-pink-400 text-lg">¡Organiza tus tareas con mucho amor!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-8 mb-6">
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="✨ Nueva tarea..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300 text-lg"
              />
            </div>
            <div>
              <textarea
                placeholder="💭 Descripción (opcional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300 resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700"
                >
                  <option value="low">🌟 Prioridad Baja</option>
                  <option value="medium">⭐ Prioridad Media</option>
                  <option value="high">🌺 Prioridad Alta</option>
                </select>
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              <Plus size={24} />
              Agregar Tarea
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6">
          <div className="flex gap-2 mb-6 bg-pink-50 p-2 rounded-2xl">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                  : 'text-pink-400 hover:bg-pink-100'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filter === 'active'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                  : 'text-pink-400 hover:bg-pink-100'
              }`}
            >
              Activas ({tasks.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filter === 'completed'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                  : 'text-pink-400 hover:bg-pink-100'
              }`}
            >
              Completadas ({tasks.filter(t => t.completed).length})
            </button>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <img
                  src="https://images.pexels.com/photos/2417842/pexels-photo-2417842.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop"
                  alt="Flores decorativas"
                  className="w-32 h-32 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
                />
                <p className="text-pink-300 text-lg">No hay tareas aquí</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-gradient-to-r ${
                    task.completed
                      ? 'from-gray-50 to-gray-100'
                      : 'from-pink-50 to-white'
                  } rounded-2xl p-5 border-2 ${
                    task.completed ? 'border-gray-200' : 'border-pink-200'
                  } transition-all hover:shadow-lg`}
                >
                  {editingTask?.id === task.id ? (
                    <form onSubmit={updateTask} className="space-y-3">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none"
                      />
                      <textarea
                        value={editingTask.description}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex gap-3">
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                          className="flex-1 px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none"
                        >
                          <option value="low">🌟 Baja</option>
                          <option value="medium">⭐ Media</option>
                          <option value="high">🌺 Alta</option>
                        </select>
                        <input
                          type="date"
                          value={editingTask.due_date || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                          className="flex-1 px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-green-400 hover:bg-green-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          <Check size={18} />
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTask(null)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          <X size={18} />
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleComplete(task)}
                        className={`mt-1 w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all flex-shrink-0 ${
                          task.completed
                            ? 'bg-pink-400 border-pink-500'
                            : 'border-pink-300 hover:border-pink-400'
                        }`}
                      >
                        {task.completed && <Check size={18} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg mb-1 ${
                          task.completed ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mb-2 ${
                            task.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${priorityColors[task.priority]}`}>
                            <Flag size={12} className="inline mr-1" />
                            {priorityLabels[task.priority]}
                          </span>
                          {task.due_date && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border-2 border-purple-300">
                              <Calendar size={12} className="inline mr-1" />
                              {new Date(task.due_date).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center mt-8 bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <img
              src="https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
              alt="Decoración rosa"
              className="w-24 h-24 rounded-2xl object-cover shadow-lg"
            />
            <img
              src="https://images.pexels.com/photos/2249528/pexels-photo-2249528.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
              alt="Flores kawaii"
              className="w-24 h-24 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <p className="text-pink-400 font-semibold text-lg mb-2">✨ Hecho con amor y mucho kawaii 💖</p>
          <p className="text-pink-300 text-sm">¡Organiza tus tareas y alcanza tus metas! 🌸</p>
        </div>
      </div>
    </div>
  );
}

export default App;
