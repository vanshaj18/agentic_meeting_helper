import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { CreateSessionData, Agent } from '@shared/types';
import { agentsAPI } from '../../services/api';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreate: (data: CreateSessionData) => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreateSessionData>({
    name: '',
    template: '',
    description: '',
    documents: '',
    cueCard: '',
    agentIds: [],
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    time: new Date().toTimeString().slice(0, 5), // Current time in HH:mm format
  });
  const [predefinedAgents, setPredefinedAgents] = useState<Agent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    agentsAPI.getAll('predefined').then(setPredefinedAgents).catch(console.error);
  }, []);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Session name is required');
      return;
    }
    onCreate(formData);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Create New Session</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Session Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="Enter session name"
              className={`w-full px-3 md:px-4 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
              } text-sm md:text-base`}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Meeting Template</label>
            <div className="relative">
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              >
                <option value="">-- Select a template --</option>
                <option value="sales">Sales Meeting</option>
                <option value="standup">Daily Standup</option>
                <option value="review">Review Meeting</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 md:top-3 w-4 md:w-5 h-4 md:h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed info like purpose, goals, agenda, participants or any additional info. More detail will mean better answers."
              rows={6}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">AI Agents</label>
            <div className="border border-gray-200 rounded-lg p-3 md:p-4 max-h-64 overflow-y-auto">
              <div className="text-xs font-medium text-gray-600 mb-3 sticky top-0 bg-white pb-2">DEFAULT AGENTS</div>
              {predefinedAgents.length === 0 ? (
                <p className="text-sm text-gray-400">Loading agents...</p>
              ) : (
                <div className="space-y-2">
                  {predefinedAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.agentIds?.includes(agent.id) || false}
                        onChange={(e) => {
                          const currentIds = formData.agentIds || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              agentIds: [...currentIds, agent.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              agentIds: currentIds.filter((id) => id !== agent.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-gray-900 rounded focus:ring-2 focus:ring-gray-900 border-gray-300 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{agent.name}</span>
                        {agent.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{agent.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm md:text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
          >
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionModal;
