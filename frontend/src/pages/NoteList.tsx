import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { type Note, type Workspace } from '../types';
import { FiPlus, FiSearch, FiTag, FiCalendar, FiFileText, FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';

export function NoteList() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword');

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace();
      fetchNotes();
    }
  }, [workspaceId]);

  async function fetchWorkspace() {
    try {
      const res = await api.get(`/workspaces/${workspaceId}`);
      setWorkspace(res.data);
    } catch (err) {
      console.error('Failed to fetch workspace:', err);
    }
  }

  async function fetchNotes(searchQuery = '') {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId: workspaceId! });
      if (searchQuery) {
        params.set('q', searchQuery);
        params.set('semantic', String(searchMode === 'semantic'));
      }
      const res = await api.get(`/notes?${params.toString()}`);
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchNotes(search);
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition mb-3">
            <FiArrowLeft className="w-3.5 h-3.5" />
            Workspaces
          </Link>
          {workspace && (
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              />
            </div>
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as 'keyword' | 'semantic')}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            >
              <option value="keyword">Keyword</option>
              <option value="semantic">AI Semantic</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/new`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition shadow-sm shrink-0"
          >
            <FiPlus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <FiFileText className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notes yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {search ? 'No notes match your search. Try different keywords.' : 'Create your first note to get started.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate(`/workspaces/${workspaceId}/new`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                New Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                to={`/workspaces/${workspaceId}/notes/${note.id}`}
                className="group block p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-brand-200 transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition truncate">
                      {note.title}
                    </h3>
                    {note.summary && (
                      <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{note.summary}</p>
                    )}
                    {note.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-full"
                          >
                            <FiTag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 shrink-0">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {format(new Date(note.updatedAt), 'MMM d')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
