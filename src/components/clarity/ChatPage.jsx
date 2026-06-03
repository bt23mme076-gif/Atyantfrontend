import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './ChatPage.css';

const TOKEN_KEY = 'atyant_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────
const linkifyText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return String(text).split(urlRegex).map((part, i) =>
    part.match(urlRegex)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
           style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}
           onClick={(e) => e.stopPropagation()}>{part}</a>
      : part
  );
};

const formatWhen = (t) => {
  const d = new Date(t || Date.now());
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return 'Just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const ProToast = ({ avatarUrl, title, preview, when, onOpen, onClose }) => (
  <div className="protoast">
    <img className="protoast-avatar" src={avatarUrl} alt={title}
      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=4f46e5&color=fff&size=44`; }} />
    <div className="protoast-body">
      <div className="protoast-title">{title}</div>
      <div className="protoast-preview">{preview}</div>
      <div className="protoast-meta">{when}</div>
    </div>
    <div className="protoast-actions">
      <button className="protoast-btn primary" onClick={onOpen}>Open</button>
      <button className="protoast-btn" onClick={onClose}>Dismiss</button>
    </div>
  </div>
);

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

const getDateLabel = (dateString) => {
  if (!dateString) return 'Unknown Date';
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  const opts = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
};

const groupMessagesByDate = (messages) => {
  const grouped = {};
  (messages || []).forEach(m => {
    if (!m?.createdAt) return;
    const label = getDateLabel(m.createdAt);
    (grouped[label] ||= []).push(m);
  });
  return grouped;
};

const Spinner = ({ label = 'Loading chat…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#667781' }}>
    <div style={{ width: 28, height: 28, border: '3px solid #d1d7db', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <p style={{ fontSize: 14 }}>{label}</p>
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────
// Props: mentor (the senior to auto-open, from "Talk to Senior"), onBack (optional)
const ChatPage = ({ mentor = null, onBack }) => {
  const { user } = useAuth();

  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [highlightedContactId, setHighlightedContactId] = useState(null);
  const [socket, setSocket] = useState(null);

  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const [unreadMap, setUnreadMap] = useState({});
  const [openMenuMsgId, setOpenMenuMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const activeToastsRef = useRef(new Map());
  const readMessagesRef = useRef(new Set());

  const mentorTargetId = mentor?.id || mentor?._id || null;

  // ── Toast for incoming messages ──
  const showMessageToast = useMemo(() => ({ partnerId, partnerName, avatar, preview, ts, messageData }) => {
    if (!partnerId) return;
    const id = activeToastsRef.current.get(partnerId) || `msg-${partnerId}`;
    const content = ({ closeToast }) => (
      <ProToast
        avatarUrl={avatar && avatar.startsWith('http') ? avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName || 'User')}&background=4f46e5&color=fff&size=44`}
        title={`New message from ${partnerName || 'contact'}`}
        preview={preview || ''}
        when={formatWhen(ts)}
        onOpen={() => { const c = contactList.find(x => x._id === partnerId); if (c) handleSelectContact(c, messageData); closeToast(); }}
        onClose={() => closeToast()}
      />
    );
    const opts = { toastId: id, icon: false, autoClose: 4000, closeOnClick: false, theme: 'light', closeButton: false,
      onClose: () => activeToastsRef.current.delete(partnerId) };
    if (activeToastsRef.current.has(partnerId)) toast.update(id, { render: content, ...opts });
    else { activeToastsRef.current.set(partnerId, id); toast(content, opts); }
  }, [contactList]); // eslint-disable-line

  // ── Decode current user + connect socket ──
  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Please sign in to chat.'); setLoading(false); return; }
    let decoded;
    try { decoded = jwtDecode(token); } catch { setError('Session expired. Please sign in again.'); setLoading(false); return; }
    const userData = { id: decoded.userId || decoded.id, role: decoded.role };
    setCurrentUser(userData);

    let s;
    (async () => {
      const { io } = await import('socket.io-client');
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;
      s = io(SOCKET_URL, {
        auth: { token }, transports: ['websocket', 'polling'],
        reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000, withCredentials: true,
      });
      s.on('connect', () => { setSocketStatus('connected'); s.emit('join_user_room', userData.id); });
      s.on('disconnect', () => setSocketStatus('disconnected'));
      s.on('connect_error', () => setSocketStatus('error'));
      s.on('reconnect', () => { setSocketStatus('connected'); s.emit('join_user_room', userData.id); });
      s.on('message_error', (d) => toast.error(d.error || 'Message blocked'));
      setSocket(s);
    })();
    return () => { s?.disconnect(); };
  }, []);

  // ── Mark incoming messages read ──
  useEffect(() => {
    if (!socket || !selectedContact || !currentUser) return;
    const unread = messages.filter(m =>
      String(m.receiver?._id || m.receiver) === String(currentUser.id) && !m.seen && !readMessagesRef.current.has(m._id)
    ).map(m => m._id);
    unread.forEach(messageId => {
      socket.emit('message_read', { messageId, sender: selectedContact._id, receiver: currentUser.id });
      readMessagesRef.current.add(messageId);
    });
  }, [messages, selectedContact, socket, currentUser]);

  // ── Status updates ──
  useEffect(() => {
    if (!socket) return;
    const handler = (u) => setMessages(prev => prev.map(m => m._id === u.messageId
      ? { ...m, status: u.status, seen: u.seen ?? m.seen, deliveredAt: u.deliveredAt || m.deliveredAt, readAt: u.readAt || m.readAt } : m));
    socket.on('message_status', handler);
    socket.on('message_status_update', handler);
    return () => { socket.off('message_status', handler); socket.off('message_status_update', handler);
      if (selectedContact) socket.emit('leave_chat', { partnerId: selectedContact._id }); };
  }, [socket]); // eslint-disable-line

  // ── Receive messages ──
  useEffect(() => {
    if (!socket || !currentUser) return;
    const onReceive = (msg) => {
      const partnerId = msg.sender === currentUser.id ? msg.receiver : msg.sender;
      const inThread = selectedContact && (
        (msg.sender === currentUser.id && msg.receiver === selectedContact._id) ||
        (msg.receiver === currentUser.id && msg.sender === selectedContact._id));
      if (inThread) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev
          : [...prev, { ...msg, status: msg.status || 'sent', seen: msg.seen || false }]);
        if (msg.receiver === currentUser.id) socket.emit('message_delivered', { messageId: msg._id, sender: msg.sender });
      } else {
        setUnreadMap(prev => {
          const set = new Set(prev[partnerId] || []); set.add(msg._id);
          return { ...prev, [partnerId]: set };
        });
      }
      setHighlightedContactId(partnerId);
      setTimeout(() => setHighlightedContactId(null), 2000);
      if (msg.sender !== currentUser.id) {
        showMessageToast({ partnerId, partnerName: msg.senderName, avatar: msg.senderAvatar,
          preview: msg.text || msg.message, ts: msg.createdAt || Date.now(), messageData: msg });
      }
    };
    socket.on('receive_private_message', onReceive);
    socket.on('new_message', onReceive);
    return () => { socket.off('receive_private_message', onReceive); socket.off('new_message', onReceive); };
  }, [socket, currentUser, selectedContact, showMessageToast]);

  // ── Load contacts + auto-open the mentor from "Talk to Senior" ──
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        setLoading(true);
        const url = currentUser.role === 'mentor'
          ? `${API_URL}/api/conversations/mentor/${currentUser.id}`
          : `${API_URL}/api/conversations/user/${currentUser.id}`;
        const token = getToken();
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.ok ? await res.json() : [];
        setContactList(Array.isArray(data) ? data : []);

        if (mentorTargetId) {
          const existing = (data || []).find(c => c._id === mentorTargetId);
          if (existing) {
            setSelectedContact(existing);
          } else {
            const mRes = await fetch(`${API_URL}/api/users/${mentorTargetId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (mRes.ok) {
              const m = await mRes.json();
              const contact = {
                _id: m._id || m.id, username: m.username || m.name, name: m.name || m.username,
                profilePicture: m.profilePicture, role: m.role || 'mentor',
              };
              setContactList(prev => [contact, ...prev]);
              setSelectedContact(contact);
            } else if (mentor) {
              // Fall back to the clarity mentor object we were handed
              const contact = { _id: mentorTargetId, username: mentor.name || mentor.username, name: mentor.name,
                profilePicture: mentor.profilePicture, role: 'mentor' };
              setContactList(prev => [contact, ...prev]);
              setSelectedContact(contact);
            }
          }
        }
      } catch {
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, mentorTargetId]); // eslint-disable-line

  const handleSelectContact = async (contact, extraMessage = null) => {
    if (!contact?._id) return;
    if (selectedContact && socket) socket.emit('leave_chat', { partnerId: selectedContact._id });
    if (socket) socket.emit('enter_chat', { partnerId: contact._id });
    setUnreadMap(prev => ({ ...prev, [contact._id]: new Set() }));
    readMessagesRef.current.clear();
    setSelectedContact(contact); setMessages([]); setError(''); setSkip(0); setAllMessagesLoaded(false);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/messages/${currentUser.id}/${contact._id}?skip=0&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('fetch failed');
      let data = await res.json();
      if (extraMessage && !data.some(m => m._id === extraMessage._id)) data = [...data, extraMessage];
      setMessages(data);
      if (data.length < limit) setAllMessagesLoaded(true);
    } catch { setError('Failed to load messages'); }
  };

  const loadMoreMessages = async () => {
    if (loadingMoreMessages || allMessagesLoaded || !selectedContact) return;
    setLoadingMoreMessages(true);
    const newSkip = skip + limit;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/messages/${currentUser.id}/${selectedContact._id}?skip=${newSkip}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.length) setAllMessagesLoaded(true);
      else { setMessages(prev => [...data, ...prev]); setSkip(newSkip); }
    } catch { /* noop */ } finally { setLoadingMoreMessages(false); }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!selectedContact?._id) { setError('No contact selected'); return; }
    if (!socket || socketStatus !== 'connected') { setError('Not connected. Please wait and retry.'); return; }
    socket.emit('private_message', {
      sender: currentUser.id, receiver: selectedContact._id,
      text: newMessage.trim(), timestamp: new Date().toISOString(),
    });
    setNewMessage(''); setError('');
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/messages/${msgId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setMessages(msgs => msgs.filter(m => m._id !== msgId));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
    setOpenMenuMsgId(null);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (loading) return <div className="chat-page"><Spinner /></div>;

  return (
    <div className="chat-page">
      <ToastContainer position="top-right" autoClose={4000} limit={3} newestOnTop pauseOnHover transition={Slide} style={{ zIndex: 9999 }} />

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>{currentUser?.role === 'user' ? 'My Mentors' : 'My Chats'}</h3>
          <div className="chat-header-status">
            <span className={`status-indicator ${socketStatus === 'connected' ? 'status-online' : 'status-offline'}`} />
            <span style={{ fontSize: 12 }}>{socketStatus}</span>
          </div>
        </div>
        {contactList.length === 0 ? (
          <p style={{ padding: 16, color: '#667781', fontSize: 14 }}>No conversations yet.</p>
        ) : (
          <ul>
            {contactList.map(contact => (
              <li key={contact._id}
                onClick={() => handleSelectContact(contact)}
                className={[selectedContact?._id === contact._id ? 'selected' : '',
                  highlightedContactId === contact._id ? 'highlighted' : ''].join(' ').trim()}>
                <div className="contact-item-wrapper">
                  <div className="contact-avatar-wrapper">
                    <img className="contact-avatar"
                      src={contact.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent((contact.username || contact.name || 'U').split(' ')[0])}&background=6366f1&color=fff&size=96&length=1`}
                      alt={contact.username || contact.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((contact.username || contact.name || 'U')[0])}&background=6366f1&color=fff&size=96&length=1`; }} />
                    <span className="contact-online-indicator" />
                  </div>
                  <div className="contact-info">
                    <div className="contact-name-row">
                      <span className="contact-name">{contact.username || contact.name || 'Unknown'}</span>
                      {unreadMap[contact._id]?.size > 0 && <span className="unread-badge">{unreadMap[contact._id].size}</span>}
                    </div>
                    <div className="contact-role">{typeof contact.role === 'string' ? contact.role : 'mentor'}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat window */}
      <div className="chat-window">
        {selectedContact ? (
          <>
            <div className="chat-header">
              {onBack && <span className="back-btn" style={{ display: 'flex' }} onClick={onBack}>&lt;</span>}
              <img className="chat-header-avatar"
                src={selectedContact.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent((selectedContact.username || selectedContact.name || 'U').split(' ')[0])}&background=6366f1&color=fff&size=96&length=1`}
                alt={selectedContact.username}
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((selectedContact.username || selectedContact.name || 'U')[0])}&background=6366f1&color=fff&size=96&length=1`; }} />
              <div className="chat-header-info">
                <h4>{selectedContact.username || selectedContact.name}</h4>
                <div className="chat-header-status">
                  <span className="status-indicator status-online" />
                  <span style={{ fontSize: 13, color: '#4f46e5' }}>Online</span>
                </div>
              </div>
            </div>

            <div className="messages-area" onScroll={(e) => { if (e.target.scrollTop === 0) loadMoreMessages(); }}>
              {loadingMoreMessages && <div className="loading-more" style={{ textAlign: 'center', fontSize: 12, color: '#667781' }}>Loading more…</div>}
              {messages.length > 0 ? Object.entries(groupMessagesByDate(messages)).map(([label, msgs]) => (
                <React.Fragment key={label}>
                  <div className="date-separator"><span className="date-label">{label}</span></div>
                  {msgs.map((msg, index) => {
                    const senderId = String(msg.sender?._id || msg.sender);
                    const isMine = senderId === String(currentUser.id);
                    const isAutoReply = msg.isAutoReply === true;
                    return (
                      <div key={`${msg._id}-${index}`} className={`message ${isMine ? 'sent' : 'received'} ${isAutoReply ? 'auto-reply' : ''}`}>
                        {isAutoReply && !isMine && <div className="auto-reply-badge">🤖 AUTOMATED RESPONSE</div>}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <p style={{ margin: 0, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{linkifyText(msg.text || msg.message)}</p>
                          {isMine && msg._id && !isAutoReply && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ cursor: 'pointer', fontSize: 20, marginLeft: 10, color: '#999' }}
                                onClick={() => setOpenMenuMsgId(openMenuMsgId === msg._id ? null : msg._id)}>&#8230;</span>
                              {openMenuMsgId === msg._id && (
                                <div style={{ position: 'absolute', right: 0, top: 24, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px #0002', zIndex: 99, minWidth: 100 }}
                                  onMouseLeave={() => setOpenMenuMsgId(null)}>
                                  <button type="button" onClick={() => handleDeleteMessage(msg._id)}
                                    style={{ width: '100%', padding: '7px 13px', color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>Delete</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="message-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span className="message-time">
                            {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span className="message-status" style={{ display: 'flex', alignItems: 'center' }}>
                              {(msg.status === 'read' || msg.seen) ? (
                                <svg width="16" height="11" viewBox="0 0 16 11" fill="#53BDEB"><path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z"/><path d="M15.071.653a.499.499 0 0 0-.707-.016L9.5 5.153l-.646-.646a.5.5 0 0 0-.708.707l1 1a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z"/></svg>
                              ) : msg.status === 'delivered' ? (
                                <svg width="16" height="11" viewBox="0 0 16 11" fill="#8696A0"><path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z"/><path d="M15.071.653a.499.499 0 0 0-.707-.016L9.5 5.153l-.646-.646a.5.5 0 0 0-.708.707l1 1a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z"/></svg>
                              ) : (
                                <svg width="12" height="11" viewBox="0 0 12 11" fill="#8696A0"><path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z"/></svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              )) : <div className="no-messages" style={{ textAlign: 'center', color: '#667781', marginTop: 40 }}>No messages yet. Say hi 👋</div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                placeholder="Type a message" rows={1} className="message-textarea"
                disabled={socketStatus !== 'connected'} />
              <button type="submit" className="send-button" aria-label="Send"
                disabled={!newMessage.trim() || socketStatus !== 'connected'}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/></svg>
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h4>Select a conversation to start chatting</h4>
            {error && <p style={{ color: '#e11d48' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
