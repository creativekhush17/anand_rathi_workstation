import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, CheckSquare, Trash, ChevronRight, CheckCircle2, User, RefreshCw, X } from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { clientService } from '../../services/client.service';
import { Task, Meeting, Client } from '../../types';

interface CalendarViewProps {
  userRole?: string;
}

export default function CalendarView({ userRole }: CalendarViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([
    { id: 'M1', clientName: 'Amit Patel', dateTime: '13 Jul 2026, 11:00 AM', topic: 'Annual Equity Allocation Review', status: 'Scheduled' },
    { id: 'M2', clientName: 'Sneha Iyer', dateTime: '14 Jul 2026, 03:30 PM', topic: 'Mutual Fund Dividend Optimization', status: 'Scheduled' },
    { id: 'M3', clientName: 'Vikram Singh', dateTime: '15 Jul 2026, 10:00 AM', topic: 'Real Estate Fund Entry Consultation', status: 'Scheduled' }
  ]);
  const [clients, setClients] = useState<Client[]>([]);

  // Role Permissions
  const allowedWriteRoles = ['Super Admin', 'Branch Head', 'Relationship Manager'];
  const canModifyTasks = allowedWriteRoles.includes(userRole || '');

  // Form states
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [newMeetClient, setNewMeetClient] = useState('');
  const [newMeetDate, setNewMeetDate] = useState('');
  const [newMeetTime, setNewMeetTime] = useState('11:00');
  const [newMeetTopic, setNewMeetTopic] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const t = await dashboardService.getTasks();
    setTasks(t);
    const c = await clientService.getClients();
    setClients(c);
  };

  const handleTaskToggle = async (id: string) => {
    if (!canModifyTasks) return;
    await dashboardService.toggleTaskStatus(id);
    const t = await dashboardService.getTasks();
    setTasks(t);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !canModifyTasks) return;
    await dashboardService.addTask(newTaskTitle, 'Today', newTaskPriority);
    setNewTaskTitle('');
    const t = await dashboardService.getTasks();
    setTasks(t);
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetClient || !newMeetTopic || !canModifyTasks) return;

    const formattedDate = new Date(newMeetDate || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newM: Meeting = {
      id: `M${meetings.length + 1}`,
      clientName: newMeetClient,
      dateTime: `${formattedDate}, ${newMeetTime}`,
      topic: newMeetTopic,
      status: 'Scheduled'
    };

    setMeetings([...meetings, newM]);
    setNewMeetClient('');
    setNewMeetTopic('');
    setShowMeetModal(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title block */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider">Advisory Calendar & Tasks</h2>
            <p className="text-[10px] text-brand-text-muted mt-0.5 font-sans">Organize client portfolio calls, and follow up on pending compliance actions.</p>
          </div>
        </div>

        {canModifyTasks && (
          <button
            id="btn-schedule-meeting"
            onClick={() => setShowMeetModal(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Client Call</span>
          </button>
        )}
      </div>

      {/* Main split: left meetings, right tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meetings panel (60%) */}
        <div className="lg:col-span-7 bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-5">Scheduled Portfolio Reviews</h3>
            
            <div className="space-y-4">
              {meetings.map((meet) => (
                <div key={meet.id} className="flex gap-4 items-start p-4 bg-brand-primary-bg/50 border border-brand-border rounded-xl">
                  <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-brand-text">{meet.clientName}</h4>
                      <span className="text-[8px] font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {meet.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-text mt-1.5 truncate">{meet.topic}</p>
                    <p className="text-[10px] text-brand-text-muted mt-1 font-mono font-medium">{meet.dateTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic task ledger (40%) */}
        <div className="lg:col-span-5 bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-5">Compliance & Follow-up Board</h3>

          {/* Add task quick form (Only if allowed) */}
          {canModifyTasks && (
            <form onSubmit={handleAddTask} className="flex gap-2 mb-5">
              <input
                type="text"
                required
                placeholder="Add follow-up task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:border-brand-gold font-sans"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="text-xs font-semibold border border-brand-border rounded-lg bg-brand-primary-bg px-2 py-1"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <button
                type="submit"
                className="bg-brand-gold hover:bg-brand-gold-accent text-white font-bold p-2 rounded-lg transition-colors"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </form>
          )}

          {/* Tasks list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => canModifyTasks && handleTaskToggle(task.id)}
                className={`flex items-center gap-3 p-3 bg-brand-primary-bg/30 border border-brand-border/60 rounded-xl ${canModifyTasks ? 'cursor-pointer hover:border-brand-gold/30' : ''} transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  disabled={!canModifyTasks}
                  onChange={() => {}}
                  className="w-4.5 h-4.5 rounded border-brand-border text-brand-gold focus:ring-brand-gold cursor-pointer"
                />
                <div className="flex-1 text-left min-w-0">
                  <h4 className={`text-xs font-bold text-brand-text truncate ${task.status === 'Completed' ? 'line-through text-brand-text-muted/60' : ''}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-brand-danger' : task.priority === 'Medium' ? 'bg-brand-gold' : 'bg-brand-text-muted'}`} />
                    <span className="text-[9px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      {task.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal - Schedule Meeting */}
      {showMeetModal && canModifyTasks && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <form onSubmit={handleScheduleMeeting} className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-gold" /> Schedule Advisory Call
              </h3>
              <button type="button" onClick={() => setShowMeetModal(false)} className="text-brand-text-muted hover:text-brand-gold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-left">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Select HNI Client *</label>
                <select
                  required
                  value={newMeetClient}
                  onChange={(e) => setNewMeetClient(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-sans"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={newMeetDate}
                    onChange={(e) => setNewMeetDate(e.target.value)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Time Stamp</label>
                  <input
                    type="time"
                    required
                    value={newMeetTime}
                    onChange={(e) => setNewMeetTime(e.target.value)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Advisory Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Portfolio Performance & Bonds Allocation"
                  value={newMeetTopic}
                  onChange={(e) => setNewMeetTopic(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-sans"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-brand-border flex gap-3">
              <button
                type="button"
                onClick={() => setShowMeetModal(false)}
                className="flex-1 bg-brand-secondary-bg hover:bg-brand-border/40 text-brand-text-muted font-bold py-2 rounded-lg text-xs transition-colors border border-brand-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Schedule Call
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
