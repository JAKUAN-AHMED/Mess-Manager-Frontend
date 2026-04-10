import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Trash2, Shield, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => parseFloat(Math.abs(n).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ShareModal({ contactId, contactName, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  // Load shared users
  useEffect(() => {
    loadSharedUsers();
  }, [contactId]);

  const loadSharedUsers = async () => {
    try {
      const res = await api.get(`/ledger/share/${contactId}/users`);
      setSharedUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load shared users:', err);
    }
  };

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.post('/ledger/search-users', { query: searchQuery });
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleShare = async (userId, canEdit = false) => {
    try {
      setError('');
      await api.post('/ledger/share', { contactId, userId, canEdit });
      await loadSharedUsers();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError(err.response?.data?.error || 'শেয়ার করতে ব্যর্থ');
    }
  };

  const handleUnshare = async (userId) => {
    if (!confirm('এই ব্যবহারকারীর কাছ থেকে শেয়ার সরানো হবে?')) return;
    try {
      await api.delete(`/ledger/share/${contactId}/${userId}`);
      await loadSharedUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'সরাতে ব্যর্থ');
    }
  };

  const isAlreadyShared = (userId) => {
    return sharedUsers.some(su => su.user._id === userId);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">শেয়ার করুন</h2>
            <p className="text-xs text-gray-400 mt-0.5">{contactName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            ব্যবহারকারী খুঁজুন
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
              placeholder="নাম বা ফোন নম্বর লিখুন..."
            />
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="mt-2 bg-gray-50 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-gray-400 text-sm">খুঁজছি...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">কোনো ব্যবহারকারী পাওয়া যায়নি</div>
              ) : (
                searchResults.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare(user._id)}
                      disabled={isAlreadyShared(user._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isAlreadyShared(user._id)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-brand-500 text-white hover:bg-brand-600'
                      }`}
                    >
                      {isAlreadyShared(user._id) ? 'শেয়ার হয়েছে' : 'শেয়ার করুন'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Shared Users List */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            শেয়ার করা হয়েছে ({sharedUsers.length})
          </label>
          {sharedUsers.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center">
              <Shield className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-sm text-gray-400">এখনো কাউকে শেয়ার করা হয়নি</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sharedUsers.map(({ user, canEdit, sharedAt }) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {canEdit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                            <ShieldCheck size={12} />
                            এডিট করতে পারবে
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                            <Shield size={12} />
                            শুধু দেখতে পারবে
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(sharedAt).toLocaleDateString('bn-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnshare(user._id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}
