import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { type Note } from '../types';
import {
  FiSave,
  FiArrowLeft,
  FiTag,
  FiFileText,
  FiHelpCircle,
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

export function NoteEditor() {
  const { workspaceId, noteId } = useParams<{ workspaceId: string; noteId: string }>();
  const navigate = useNavigate();
  const isNew = !noteId || noteId === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!isNew && noteId) {
      fetchNote();
    }
  }, [noteId]);

  async function fetchNote() {
    setLoading(true);
    try {
      const res = await api.get(`/notes/${noteId}`);
      const note: Note = res.data;
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setSummary(note.summary);
    } catch (err) {
      console.error('Failed to fetch note:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/notes', { title, content, workspaceId });
      } else {
        await api.put(`/notes/${noteId}`, { title, content });
      }
      navigate(`/workspaces/${workspaceId}`);
    } catch (err: any) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  }

  async function summarizeNote() {
    if (isNew) return;
    setAiLoading('summarize');
    try {
      const res = await api.post(`/ai/notes/${noteId}/summarize`);
      setSummary(res.data.summary);
    } catch (err: any) {
      console.error('Failed to summarize:', err);
    } finally {
      setAiLoading(null);
    }
  }

  async function generateTags() {
    if (isNew) return;
    setAiLoading('tags');
    try {
      const res = await api.post(`/ai/notes/${noteId}/tags`);
      setTags(res.data.tags);
    } catch (err: any) {
      console.error('Failed to generate tags:', err);
    } finally {
      setAiLoading(null);
    }
  }

  async function askQuestion() {
    if (isNew || !question.trim()) return;
    setAiLoading('ask');
    try {
      const res = await api.post(`/ai/notes/${noteId}/ask`, { question });
      setAnswer(res.data.answer);
    } catch (err: any) {
      console.error('Failed to ask question:', err);
    } finally {
      setAiLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}`)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? 'New Note' : 'Edit Note'}
            </h1>
          </div>
          <button
            onClick={saveNote}
            disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full px-0 py-2 text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-brand-500 focus:ring-0 bg-transparent placeholder-gray-300 mb-6 transition"
        />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-full"
              >
                <FiTag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mb-6 p-4 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wide">AI Summary</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Editor tabs */}
        <div className="mb-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                !showPreview
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                showPreview
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>

          {showPreview ? (
            <div className="p-6 min-h-[350px] bg-white border border-gray-200 border-t-0 rounded-b-xl prose prose-sm max-w-none">
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">Nothing to preview</p>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing... (Markdown supported)"
              className="w-full min-h-[350px] px-4 py-3 border border-gray-200 border-t-0 rounded-b-xl focus:outline-none focus:border-brand-500 resize-y font-mono text-sm leading-relaxed transition"
            />
          )}
        </div>

        {/* AI Tools */}
        {!isNew && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={summarizeNote}
              disabled={aiLoading === 'summarize'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 disabled:opacity-50 transition"
            >
              <FiFileText className="w-4 h-4" />
              {aiLoading === 'summarize' ? 'Summarizing...' : 'Summarize'}
            </button>
            <button
              onClick={generateTags}
              disabled={aiLoading === 'tags'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 disabled:opacity-50 transition"
            >
              <FiTag className="w-4 h-4" />
              {aiLoading === 'tags' ? 'Tagging...' : 'Generate Tags'}
            </button>
            <button
              onClick={() => setShowAsk(!showAsk)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition"
            >
              <FiHelpCircle className="w-4 h-4" />
              Ask AI
            </button>
          </div>
        )}

        {/* Ask AI panel */}
        {showAsk && !isNew && (
          <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ask about this note</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                placeholder="What would you like to know?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                onClick={askQuestion}
                disabled={aiLoading === 'ask' || !question.trim()}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {aiLoading === 'ask' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Ask'
                )}
              </button>
            </div>
            {answer && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg prose prose-sm max-w-none">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
