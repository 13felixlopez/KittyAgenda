import { useEffect, useMemo, useState } from 'react';
import { supabase, Task } from './lib/supabase';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  Flag,
  LogOut,
  Sparkles,
  Heart,
  Search,
  Wand2,
  Cat,
  ClipboardCheck,
  LayoutDashboard
} from 'lucide-react';
import { AuthForm } from './components/AuthForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const, due_date: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'urgent'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [view, setView] = useState<'dashboard' | 'tasks'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

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
    setStatusMessage({ tone: 'info', text: 'Cerraste sesión. ¡Vuelve pronto para seguir organizando con Hello Kitty!' });
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
      setStatusMessage({
        tone: 'error',
        text: 'Necesitamos un título para que Hello Kitty recuerde la tarea. Agrega uno dulce y breve.'
      });
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
        setStatusMessage({
          tone: 'error',
          text: 'No pudimos guardar la tarea. Revisa tu conexión y vuelve a intentarlo.'
        });
        return;
      }

      if (data) {
        setTasks([data, ...tasks]);
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
        setStatusMessage({
          tone: 'success',
          text: 'Tarea guardada con glitter. ¡Hello Kitty aplaude tu organización!'
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setStatusMessage({
        tone: 'error',
        text: 'Ocurrió un error inesperado al guardar la tarea. Intenta nuevamente en unos segundos.'
      });
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
      setStatusMessage({
        tone: data.completed ? 'success' : 'info',
        text: data.completed
          ? '¡Listo! Marcaste la tarea como completada. Hello Kitty celebra contigo. 🎉'
          : 'Tarea reactivada. ¡Vamos a darle seguimiento con brillo y constancia!'
      });
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
        due_date: editingTask.due_date || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingTask.id)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === data.id ? data : t));
      setEditingTask(null);
      setStatusMessage({
        tone: 'success',
        text: 'Actualizaste los detalles con cariño. Los cambios quedaron guardados.'
      });
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
      setStatusMessage({
        tone: 'info',
        text: 'Eliminaste la tarea. Si fue un error, siempre puedes crearla de nuevo con un nuevo toque kawaii.'
      });
    }
  };

  const kittyUser = useMemo(() => userEmail?.split('@')[0] || 'amigx', [userEmail]);

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      if (filter === 'urgent') {
        if (!task.due_date || task.completed) return false;
        const today = new Date();
        const dueDate = new Date(task.due_date);
        const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      }
      return true;
    })
    .filter(task => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
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

  const getDueStatus = (task: Task) => {
    if (!task.due_date) {
      return { label: 'Sin fecha, planéala pronto', style: 'bg-pink-50 text-pink-500 border-pink-200' };
    }
    const today = new Date();
    const dueDate = new Date(task.due_date);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Vencida, dale amor urgente', style: 'bg-red-50 text-red-600 border-red-200' };
    }
    if (diffDays === 0) {
      return { label: 'Vence hoy, a brillar ✨', style: 'bg-orange-50 text-orange-600 border-orange-200' };
    }
    if (diffDays <= 3) {
      return { label: `Vence en ${diffDays} día(s)`, style: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    return { label: `Lista para ${dueDate.toLocaleDateString('es-ES')}`, style: 'bg-green-50 text-green-600 border-green-200' };
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.filter(t => !t.completed).length;
  const urgentCount = tasks.filter(t => {
    if (!t.due_date || t.completed) return false;
    const today = new Date();
    const dueDate = new Date(t.due_date);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const progressTone = completionRate === 100 ? 'bg-green-400' : completionRate > 60 ? 'bg-pink-500' : 'bg-amber-400';
  const motivationalLine = tasks.length === 0
    ? 'Crea tu primer tarea y Hello Kitty preparará una lluvia de confeti para celebrarte.'
    : completionRate >= 80
      ? '¡Estás arrasando! Un par de tareas más y el listón quedará perfecto.'
      : 'Sigue adelante, cada tarea completada suma una estrella brillante.';

  if (!userId) {
    return <AuthForm />;
  }

  const urgentTasks = tasks.filter(t => {
    if (!t.due_date || t.completed) return false;
    const today = new Date();
    const dueDate = new Date(t.due_date);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 4);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-white relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,192,203,0.35), rgba(255,255,255,0.7)), url("https://ibb.co/21HfMPtV")`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-pink-400 text-8xl">🎀</div>
        <div className="absolute top-32 right-20 text-pink-400 text-6xl">💕</div>
        <div className="absolute bottom-20 left-32 text-pink-400 text-7xl">🌸</div>
        <div className="absolute bottom-40 right-40 text-pink-400 text-6xl">✨</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,192,203,0.25),transparent_20%),radial-gradient(circle_at_90%_10%,rgba(255,182,193,0.2),transparent_18%),radial-gradient(circle_at_30%_80%,rgba(255,192,203,0.2),transparent_20%)]" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSignOut}
            className="bg-white border-2 border-pink-200 hover:border-pink-400 text-pink-500 px-6 py-2 rounded-2xl font-semibold flex items-center gap-2 transition-all hover:shadow-lg"
          >
            <LogOut size={18} />
            Cerrar Sesion
          </button>
        </div>

        <div className="text-center mb-10 relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl">🎀</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
              Agenda Hello Kitty
            </h1>
            <div className="text-6xl">💖</div>
          </div>
          <p className="text-pink-400 text-lg mb-3">Hola {kittyUser}, esta es tu nube de tareas kawaii.</p>
          <p className="text-pink-300 text-sm">Organiza, prioriza y recibe mensajes claros pensados para ti.</p>
          <div className="absolute -top-6 right-4 bg-white border-4 border-pink-200 rounded-full p-3 shadow-xl hidden sm:block">
            <img
              src="https://ibb.co/FQxtypm"
              alt="Hello Kitty"
              className="w-16 h-16 object-contain rounded-full"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-pink-100">
              <img src="https://ibb.co/ycs0tDcc" alt="Hello Kitty arcoiris" className="w-full h-full object-cover" />
            </div>
            <div className="h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-pink-100">
              <img src="https://ibb.co/W4srXwZF" alt="Hello Kitty feliz" className="w-full h-full object-cover" />
            </div>
            <div className="h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-pink-100">
              <img src="https://ibb.co/cSCjnrw1" alt="Hello Kitty agenda" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold border-2 transition-all ${
              view === 'dashboard'
                ? 'bg-pink-500 text-white border-pink-400 shadow-lg'
                : 'bg-white/80 text-pink-500 border-pink-200 hover:border-pink-400'
            }`}
          >
            <LayoutDashboard size={18} />
            Panel
          </button>
          <button
            onClick={() => setView('tasks')}
            className={`px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold border-2 transition-all ${
              view === 'tasks'
                ? 'bg-pink-500 text-white border-pink-400 shadow-lg'
                : 'bg-white/80 text-pink-500 border-pink-200 hover:border-pink-400'
            }`}
          >
            <ClipboardCheck size={18} />
            Lista de tareas
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 rounded-2xl border-2 px-4 py-3 shadow-md flex items-center gap-2 ${
              statusMessage.tone === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : statusMessage.tone === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-pink-50 border-pink-200 text-pink-600'
            }`}
          >
            <Wand2 size={18} />
            <span className="text-sm">{statusMessage.text}</span>
          </div>
        )}

        {view === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur rounded-3xl border-2 border-pink-200 p-4 shadow-lg flex items-center gap-3">
                <Sparkles className="text-pink-500" />
                <div>
                  <p className="text-xs uppercase text-pink-400">Progreso</p>
                  <p className="text-lg font-semibold text-pink-600">{completionRate}% completado</p>
                  <div className="mt-2 w-full bg-pink-50 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${progressTone}`} style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-3xl border-2 border-pink-200 p-4 shadow-lg flex items-center gap-3">
                <Heart className="text-red-400" />
                <div>
                  <p className="text-xs uppercase text-pink-400">Activas</p>
                  <p className="text-lg font-semibold text-pink-600">{activeCount} tareas pendientes</p>
                  <p className="text-xs text-pink-300">{motivationalLine}</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-3xl border-2 border-pink-200 p-4 shadow-lg flex items-center gap-3">
                <Cat className="text-pink-500" />
                <div>
                  <p className="text-xs uppercase text-pink-400">Urgencias</p>
                  <p className="text-lg font-semibold text-pink-600">{urgentCount} listas</p>
                  <p className="text-xs text-pink-300">Hello Kitty te avisa lo que vence pronto.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-cover" style={{ backgroundImage: 'url("https://ibb.co/7xKLThDw")' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={18} className="text-pink-500" />
                    <p className="font-semibold text-pink-600">Urgentes (próx. 3 días)</p>
                  </div>
                  {urgentTasks.length === 0 ? (
                    <p className="text-pink-400 text-sm">No hay urgencias ahora. Respira y sigue con calma.</p>
                  ) : (
                    <div className="space-y-3">
                      {urgentTasks.slice(0, 4).map(task => (
                        <div key={task.id} className="p-3 rounded-2xl border-2 border-pink-100 bg-pink-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-pink-700 truncate">{task.title}</span>
                            <span className="text-xs text-pink-500">{getDueStatus(task).label}</span>
                          </div>
                          {task.description && <p className="text-xs text-pink-400 mt-1 line-clamp-2">{task.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-cover" style={{ backgroundImage: 'url("https://ibb.co/3YYR8J8H")' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-pink-500" />
                    <p className="font-semibold text-pink-600">En marcha</p>
                  </div>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-pink-400 text-sm">Agrega tus tareas para verlas aquí.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-2xl border-2 border-pink-100 bg-white/70">
                          <div className="mt-1">
                            <div className="w-3 h-3 rounded-full bg-pink-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700">{task.title}</p>
                            {task.description && <p className="text-xs text-pink-400 line-clamp-2">{task.description}</p>}
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-pink-500 px-2 py-1 rounded-full bg-pink-50 border border-pink-100">Prioridad {priorityLabels[task.priority]}</span>
                              <span className="text-xs text-pink-500 px-2 py-1 rounded-full bg-pink-50 border border-pink-100">{getDueStatus(task).label}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-8 mb-6 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 bg-pink-50 border-4 border-pink-200 w-28 h-28 rounded-full opacity-70" />
              <div className="absolute -left-10 -bottom-10 bg-pink-50 border-4 border-pink-200 w-32 h-32 rounded-full opacity-60" />
              <div className="absolute inset-y-0 right-6 w-24 opacity-60 hidden md:block">
                <img src="https://ibb.co/N64pkJLD" alt="Hello Kitty planeando" className="w-full h-full object-contain" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={20} />
                    <input
                      type="text"
                      placeholder="Busca por título o descripción"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300"
                    />
                  </div>
                  <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl px-4 py-3 text-pink-400 text-sm">
                    Tip: usa palabras clave como "examen" o "cita" para encontrarlas rápido.
                  </div>
                </div>
                <form onSubmit={addTask} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="✨ Nueva tarea... (ej. Revisar agenda con Hello Kitty)"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300 text-lg"
                    />
                    <p className="text-xs text-pink-300 mt-1">Un título claro ayuda a recibir recordatorios útiles.</p>
                  </div>
                  <div>
                    <textarea
                      placeholder="💭 Detalles dulces y específicos... ¿Qué necesitas lograr?"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700"
                      >
                        <option value="low">🌟 Prioridad Baja - sin prisa, pero con brillo</option>
                        <option value="medium">⭐ Prioridad Media - dale un abrazo pronto</option>
                        <option value="high">🌺 Prioridad Alta - Hello Kitty la marca como urgente</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700"
                      />
                      <p className="text-xs text-pink-300 mt-1">Define una fecha para recibir alertas más claras.</p>
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
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6">
              <div className="flex flex-col md:flex-row gap-2 mb-6 bg-pink-50 p-2 rounded-2xl">
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
                <button
                  onClick={() => setFilter('urgent')}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    filter === 'urgent'
                      ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                      : 'text-pink-400 hover:bg-pink-100'
                  }`}
                >
                  Urgentes ({urgentCount})
                </button>
              </div>

              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <img
                      src="https://ibb.co/Q38xDy8X"
                      alt="Hello Kitty sin tareas"
                      className="w-32 h-32 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
                    />
                    <p className="text-pink-300 text-lg mb-2">No hay tareas aquí</p>
                    <p className="text-pink-400 text-sm">Escribe una idea y Hello Kitty te ayudará a darle forma.</p>
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
                            aria-label={task.completed ? 'Reactivar tarea' : 'Terminar tarea'}
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
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getDueStatus(task).style}`}>
                                <Calendar size={12} className="inline mr-1" />
                                {getDueStatus(task).label}
                              </span>
                              {!task.completed && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-600 border-2 border-pink-200">
                                  <Heart size={12} className="inline mr-1" />
                                  Dale cariño hoy
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleComplete(task)}
                              className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                task.completed
                                  ? 'bg-white text-pink-500 border-pink-200 hover:border-pink-400'
                                  : 'bg-pink-500 text-white border-pink-400 hover:bg-pink-600'
                              }`}
                            >
                              {task.completed ? 'Reactivar' : 'Terminar'}
                            </button>
                            <div className="flex gap-2">
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
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-8 bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-6 relative overflow-hidden">
          <div className="absolute -left-6 -top-6 bg-pink-100 w-24 h-24 rounded-full opacity-40" />
          <div className="absolute -right-10 bottom-0 bg-rose-100 w-32 h-32 rounded-full opacity-30" />
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <img
                src="https://ibb.co/W4srXwZF"
                alt="Hello Kitty decor"
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
              <img
                src="https://ibb.co/cSCjnrw1"
                alt="Hello Kitty flores"
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
            </div>
            <p className="text-pink-400 font-semibold text-lg mb-2">✨ Hecho con amor y mucho Hello Kitty 💖</p>
            <p className="text-pink-300 text-sm">Organiza tus tareas y recibe mensajes claros, bonitos y accionables. 🌸</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
