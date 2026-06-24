import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { API_URL } from '../../api';
import { useAuth } from '../../context/AuthContext';
import useIsMobile from '../../hooks/useIsMobile';
import './ChatPage.css';

const TOKEN_KEY = 'atyant_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const CHAT_SERVICE_ID = 'text-qa';

// ── Helpers ──────────────────────────────────────────────────────────────────
const avatarFor = (pic, name) =>
  pic && pic.startsWith('http')
    ? pic
    : `https://ui-avatars.com/api/?name=${encodeURIComponent((name || 'U').split(' ')[0])}&background=7567C9&color=fff&size=96&length=1`;

const linkifyText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return String(text).split(urlRegex).map((part, i) =>
    part.match(urlRegex)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
           className="msg-link" onClick={(e) => e.stopPropagation()}>{part}</a>
      : <React.Fragment key={i}>{part}</React.Fragment>
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

const formatTime = (t) =>
  new Date(t || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

const getDateLabel = (dateString) => {
  if (!dateString) return 'Unknown';
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
  const groups = [];
  let current = null;
  (messages || []).forEach((m) => {
    if (!m?.createdAt && !m?.timestamp) return;
    const label = getDateLabel(m.createdAt || m.timestamp);
    if (!current || current.label !== label) {
      current = { label, items: [] };
      groups.push(current);
    }
    current.items.push(m);
  });
  return groups;
};

const normalizeMsg = (msg) => ({
  ...msg,
  text: msg.text || msg.message,
  createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
  status: msg.status || 'sent',
  seen: msg.seen || false,
});

// ── Toast for incoming messages ──────────────────────────────────────────────
const ProToast = ({ avatarUrl, title, preview, when, onOpen, onClose }) => (
  <div className="protoast">
    <img className="protoast-avatar" src={avatarUrl} alt={title}
      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=7567C9&color=fff&size=44`; }} />
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

// ── Delivery tick (single / double / blue) ───────────────────────────────────
const Ticks = ({ status, seen }) => {
  if (status === 'read' || seen) {
    return (
      <svg className="tick read" width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
        <path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z" />
        <path d="M15.071.653a.499.499 0 0 0-.707-.016L9.5 5.153l-.646-.646a.5.5 0 0 0-.708.707l1 1a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z" />
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg className="tick" width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
        <path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z" />
        <path d="M15.071.653a.499.499 0 0 0-.707-.016L9.5 5.153l-.646-.646a.5.5 0 0 0-.708.707l1 1a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z" />
      </svg>
    );
  }
  return (
    <svg className="tick" width="12" height="11" viewBox="0 0 12 11" fill="currentColor">
      <path d="M11.071.653a.499.499 0 0 0-.707-.016L5.5 5.153 2.354 2.009a.5.5 0 0 0-.708.707l3.5 3.5a.5.5 0 0 0 .708 0l5.217-5.217a.5.5 0 0 0-.001-.346z" />
    </svg>
  );
};

// ── Skeleton loaders ─────────────────────────────────────────────────────────
const ContactSkeleton = () => (
  <div className="contact-skeleton">
    <div className="sk-avatar shimmer" />
    <div className="sk-lines">
      <div className="sk-line shimmer" style={{ width: '62%' }} />
      <div className="sk-line shimmer" style={{ width: '44%' }} />
    </div>
  </div>
);

const MessageSkeleton = () => (
  <div className="msg-skeleton-area">
    {[['received', 58], ['received', 40], ['sent', 50], ['received', 66], ['sent', 36]].map(([side, w], i) => (
      <div key={i} className={`msg-skeleton ${side}`}>
        <div className="sk-bubble shimmer" style={{ width: `${w}%` }} />
      </div>
    ))}
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────
// Props: mentor (partner to auto-open, from "Talk to Senior" / deep link), onBack
const ChatPage = ({ mentor = null, onBack }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [socket, setSocket] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [entitlement, setEntitlement] = useState({ loading: false, allowed: false, expired: false, expiresAt: null });

  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const [openMenuMsgId, setOpenMenuMsgId] = useState(null);
  const [mobilePane, setMobilePane] = useState('list'); // 'list' | 'chat'

  const messagesAreaRef = useRef(null);
  const activeToastsRef = useRef(new Map());
  const readMessagesRef = useRef(new Set());
  const sendTimerRef = useRef(null);

  // Stable refs for socket handlers (avoid stale closures / re-subscription).
  const currentUserRef = useRef(null);
  const selectedContactRef = useRef(null);
  const contactListRef = useRef([]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { selectedContactRef.current = selectedContact; }, [selectedContact]);
  useEffect(() => { contactListRef.current = contactList; }, [contactList]);

  const mentorTargetId = mentor?.id || mentor?._id || null;
  const isStudent = currentUser?.role !== 'mentor';
  const partnerOnline = selectedContact ? onlineUsers.has(String(selectedContact._id)) : false;

  // ── Incoming-message toast ──
  const showMessageToast = useCallback(({ partnerId, partnerName, avatar, preview, ts }) => {
    if (!partnerId) return;
    const id = activeToastsRef.current.get(partnerId) || `msg-${partnerId}`;
    const content = ({ closeToast }) => (
      <ProToast
        avatarUrl={avatarFor(avatar, partnerName)}
        title={`New message from ${partnerName || 'contact'}`}
        preview={preview || ''}
        when={formatWhen(ts)}
        onOpen={() => {
          const c = contactListRef.current.find((x) => String(x._id) === String(partnerId));
          if (c) handleSelectContact(c);
          closeToast();
        }}
        onClose={() => closeToast()}
      />
    );
    const opts = {
      toastId: id, icon: false, autoClose: 4000, closeOnClick: false, closeButton: false,
      onClose: () => activeToastsRef.current.delete(partnerId),
    };
    if (activeToastsRef.current.has(partnerId)) toast.update(id, { render: content, ...opts });
    else { activeToastsRef.current.set(partnerId, id); toast(content, opts); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Decode current user ──
  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Please sign in to chat.'); setLoadingContacts(false); return; }
    try {
      const decoded = jwtDecode(token);
      setCurrentUser({ id: decoded.userId || decoded.id || decoded._id, role: decoded.role });
    } catch {
      setError('Session expired. Please sign in again.'); setLoadingContacts(false);
    }
  }, []);

  // ── Connect socket once ──
  useEffect(() => {
    if (!currentUser) return;
    let s;
    let cancelled = false;
    (async () => {
      const { io } = await import('socket.io-client');
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;
      s = io(SOCKET_URL, {
        auth: { token: getToken() }, transports: ['websocket', 'polling'],
        reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1500, withCredentials: true,
      });
      const onConnect = () => {
        setSocketStatus('connected');
        s.emit('join_user_room');
        s.emit('get_presence', contactListRef.current.map((c) => String(c._id)));
      };
      s.on('connect', onConnect);
      s.on('reconnect', onConnect);
      s.on('disconnect', () => setSocketStatus('disconnected'));
      s.on('connect_error', () => setSocketStatus('error'));
      if (!cancelled) setSocket(s);
    })();
    return () => { cancelled = true; s?.disconnect(); };
  }, [currentUser]);

  // ── Socket event listeners (registered once per socket) ──
  useEffect(() => {
    if (!socket) return;

    const onReceive = (raw) => {
      const me = currentUserRef.current?.id;
      if (!me) return;
      const msg = normalizeMsg(raw);
      const partnerId = String(msg.sender) === String(me) ? String(msg.receiver) : String(msg.sender);
      const sel = selectedContactRef.current;
      const inThread = sel && String(partnerId) === String(sel._id);

      if (inThread) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        if (String(msg.receiver) === String(me) && !readMessagesRef.current.has(msg._id)) {
          socket.emit('message_delivered', { messageId: msg._id, sender: msg.sender });
          socket.emit('message_read', { messageId: msg._id, sender: msg.sender, receiver: me });
          readMessagesRef.current.add(msg._id);
        }
      }
      if (String(msg.sender) === String(me)) {
        setSending(false);
        if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      }

      // Update sidebar: last message, unread, ordering (move to top).
      setContactList((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(partnerId));
        if (idx === -1) { fetchContacts(); return prev; }
        const c = { ...prev[idx] };
        c.lastMessage = msg.text;
        c.lastMessageAt = msg.createdAt;
        c.lastSenderIsMe = String(msg.sender) === String(me);
        if (String(msg.sender) !== String(me) && !inThread) c.unreadCount = (c.unreadCount || 0) + 1;
        const rest = prev.filter((_, i) => i !== idx);
        return [c, ...rest];
      });

      if (String(msg.sender) !== String(me) && !inThread) {
        showMessageToast({ partnerId, partnerName: msg.senderName, avatar: msg.senderAvatar, preview: msg.text, ts: msg.createdAt });
      }
    };

    const onStatus = (u) => setMessages((prev) => prev.map((m) =>
      m._id === u.messageId
        ? { ...m, status: u.status, seen: u.seen ?? m.seen, deliveredAt: u.deliveredAt || m.deliveredAt, readAt: u.readAt || m.readAt }
        : m));

    const onBulkRead = ({ reader }) => {
      const sel = selectedContactRef.current;
      if (sel && String(sel._id) === String(reader)) {
        setMessages((prev) => prev.map((m) =>
          String(m.sender?._id || m.sender) === String(currentUserRef.current?.id)
            ? { ...m, status: 'read', seen: true } : m));
      }
    };

    const onDeleted = ({ messageId }) => setMessages((prev) => prev.filter((m) => m._id !== messageId));

    const onPresenceUpdate = ({ userId, online }) => setOnlineUsers((prev) => {
      const next = new Set(prev);
      if (online) next.add(String(userId)); else next.delete(String(userId));
      return next;
    });
    const onPresenceSnapshot = ({ online }) => setOnlineUsers(new Set((online || []).map(String)));

    const onMessageError = (d) => {
      setSending(false);
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      if (d?.code === 'NO_ENTITLEMENT') {
        setEntitlement({ loading: false, allowed: false, expired: false, expiresAt: null });
        toast.error('Book a session to unlock chat.');
      } else {
        toast.error(d?.error || 'Message could not be sent');
      }
    };

    const onResolved = () => toast.info('Your mentor marked this conversation as resolved.');

    socket.on('receive_private_message', onReceive);
    socket.on('new_message', onReceive);
    socket.on('message_status', onStatus);
    socket.on('message_status_update', onStatus);
    socket.on('messages_read_bulk', onBulkRead);
    socket.on('message_deleted', onDeleted);
    socket.on('presence_update', onPresenceUpdate);
    socket.on('presence_snapshot', onPresenceSnapshot);
    socket.on('message_error', onMessageError);
    socket.on('chat_resolved', onResolved);

    return () => {
      socket.off('receive_private_message', onReceive);
      socket.off('new_message', onReceive);
      socket.off('message_status', onStatus);
      socket.off('message_status_update', onStatus);
      socket.off('messages_read_bulk', onBulkRead);
      socket.off('message_deleted', onDeleted);
      socket.off('presence_update', onPresenceUpdate);
      socket.off('presence_snapshot', onPresenceSnapshot);
      socket.off('message_error', onMessageError);
      socket.off('chat_resolved', onResolved);
    };
  }, [socket, showMessageToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch contacts ──
  const fetchContacts = useCallback(async () => {
    const cu = currentUserRef.current;
    if (!cu) return [];
    const url = cu.role === 'mentor'
      ? `${API_URL}/api/conversations/mentor/${cu.id}`
      : `${API_URL}/api/conversations/user/${cu.id}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = res.ok ? await res.json() : [];
      const list = Array.isArray(data) ? data : [];
      setContactList(list);
      if (socket && socketStatus === 'connected') s_emitPresence(list);
      return list;
    } catch {
      return [];
    }
  }, [socket, socketStatus]);

  const s_emitPresence = (list) => {
    try { socket?.emit('get_presence', list.map((c) => String(c._id))); } catch { /* noop */ }
  };

  // ── Initial load + auto-open the mentor (from "Talk to Senior" / deep link) ──
  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    (async () => {
      setLoadingContacts(true);
      const data = await fetchContacts();
      if (!alive) return;

      if (mentorTargetId) {
        const existing = (data || []).find((c) => String(c._id) === String(mentorTargetId));
        if (existing) {
          handleSelectContact(existing);
        } else {
          try {
            const mRes = await fetch(`${API_URL}/api/users/${mentorTargetId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (mRes.ok) {
              const m = await mRes.json();
              const contact = {
                _id: m._id || m.id, username: m.username || m.name, name: m.name || m.username,
                profilePicture: m.profilePicture, role: m.role || 'mentor', unreadCount: 0,
              };
              setContactList((prev) => (prev.some((c) => String(c._id) === String(contact._id)) ? prev : [contact, ...prev]));
              handleSelectContact(contact);
            } else if (mentor) {
              const contact = {
                _id: mentorTargetId, username: mentor.name || mentor.username, name: mentor.name,
                profilePicture: mentor.profilePicture, role: 'mentor', unreadCount: 0,
              };
              setContactList((prev) => (prev.some((c) => String(c._id) === String(contact._id)) ? prev : [contact, ...prev]));
              handleSelectContact(contact);
            }
          } catch { /* noop */ }
        }
      }
      if (alive) setLoadingContacts(false);
    })();
    return () => { alive = false; };
  }, [currentUser, mentorTargetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Entitlement check for the selected contact ──
  const checkEntitlement = useCallback(async (contact) => {
    if (!contact?._id) return;
    if (currentUserRef.current?.role === 'mentor') {
      setEntitlement({ loading: false, allowed: true, expired: false, expiresAt: null });
      return;
    }
    setEntitlement({ loading: true, allowed: false, expired: false, expiresAt: null });
    try {
      const res = await fetch(`${API_URL}/api/chat/entitlement/${contact._id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = res.ok ? await res.json() : { allowed: false };
      setEntitlement({ loading: false, allowed: !!d.allowed, expired: !!d.expired, expiresAt: d.expiresAt || null });
    } catch {
      setEntitlement({ loading: false, allowed: false, expired: false, expiresAt: null });
    }
  }, []);

  // ── Select a contact ──
  const handleSelectContact = useCallback(async (contact) => {
    if (!contact?._id) return;
    const cu = currentUserRef.current;
    const prevSel = selectedContactRef.current;
    if (prevSel && socket) socket.emit('leave_chat', { partnerId: prevSel._id });
    if (socket) socket.emit('enter_chat', { partnerId: contact._id });

    readMessagesRef.current.clear();
    setSelectedContact(contact);
    setMessages([]); setError(''); setSkip(0); setAllMessagesLoaded(false);
    setMobilePane('chat');
    setOpenMenuMsgId(null);

    // Clear unread badge locally + on the server.
    setContactList((prev) => prev.map((c) => (String(c._id) === String(contact._id) ? { ...c, unreadCount: 0 } : c)));
    fetch(`${API_URL}/api/messages/read/${contact._id}`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } }).catch(() => {});

    checkEntitlement(contact);

    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/${cu.id}/${contact._id}?skip=0&limit=${limit}`,
        { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setMessages(data.map(normalizeMsg));
      if (data.length < limit) setAllMessagesLoaded(true);
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [socket, checkEntitlement]);

  // ── Load older messages on scroll-to-top ──
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || allMessagesLoaded || !selectedContact) return;
    setLoadingMore(true);
    const newSkip = skip + limit;
    const el = messagesAreaRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const res = await fetch(`${API_URL}/api/messages/${currentUser.id}/${selectedContact._id}?skip=${newSkip}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!data.length) setAllMessagesLoaded(true);
      else {
        setMessages((prev) => [...data.map(normalizeMsg), ...prev]);
        setSkip(newSkip);
        // Keep scroll position stable after prepending.
        requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
      }
    } catch { /* noop */ } finally { setLoadingMore(false); }
  }, [loadingMore, allMessagesLoaded, selectedContact, skip, currentUser]);

  // ── Mark any unread incoming messages as read while the thread is open ──
  useEffect(() => {
    if (!socket || !selectedContact || !currentUser) return;
    const unread = messages.filter((m) =>
      String(m.receiver?._id || m.receiver) === String(currentUser.id) && !m.seen && !readMessagesRef.current.has(m._id));
    unread.forEach((m) => {
      socket.emit('message_read', { messageId: m._id, sender: selectedContact._id, receiver: currentUser.id });
      readMessagesRef.current.add(m._id);
    });
  }, [messages, selectedContact, socket, currentUser]);

  // ── Send ──
  const canSend = socketStatus === 'connected' && (!isStudent || entitlement.allowed);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;
    if (!selectedContact?._id) { setError('No contact selected'); return; }
    if (isStudent && !entitlement.allowed) { toast.error('Book a session to unlock chat.'); return; }
    if (!socket || socketStatus !== 'connected') { setError('Not connected. Please wait and retry.'); return; }

    setSending(true);
    socket.emit('private_message', {
      sender: currentUser.id, receiver: selectedContact._id,
      text, timestamp: new Date().toISOString(),
    });
    setNewMessage(''); setError('');
    // Safety: clear "sending" if no echo arrives.
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    sendTimerRef.current = setTimeout(() => setSending(false), 6000);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${msgId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      setMessages((msgs) => msgs.filter((m) => m._id !== msgId));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
    setOpenMenuMsgId(null);
  };

  // ── Mentor: mark conversation resolved ──
  const handleResolve = async () => {
    if (!selectedContact) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/resolve/${selectedContact._id}`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      toast.success('Marked as resolved');
    } catch { toast.error('Could not mark resolved'); }
  };

  // ── Student: book the Text Q&A session to unlock chat ──
  const handleBookSession = () => {
    const c = selectedContact;
    if (!c) return;
    if (window.openBooking) {
      window.openBooking({
        mentorId: c._id, mentorName: c.username || c.name, mentorPic: c.profilePicture,
        preselectServiceId: CHAT_SERVICE_ID,
      });
    } else {
      toast.info('Open this mentor’s profile to book a session.');
    }
  };

  // ── Keep pinned to the latest message ──
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el || loadingMore) return;
    const toBottom = () => { el.scrollTop = el.scrollHeight; };
    requestAnimationFrame(toBottom);
    const t = setTimeout(toBottom, 120);
    return () => clearTimeout(t);
  }, [messages, loadingMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup pending timers on unmount ──
  useEffect(() => () => { if (sendTimerRef.current) clearTimeout(sendTimerRef.current); }, []);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);
  const partnerName = selectedContact ? (selectedContact.username || selectedContact.name || 'Mentor') : '';

  // ── Render ──
  const containerClass = ['chat-page', isMobile ? `mobile mobile-${mobilePane}` : ''].join(' ').trim();

  return (
    <div className={containerClass}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>{isStudent ? 'My Mentors' : 'My Chats'}</h3>
          <div className={`conn-pill ${socketStatus === 'connected' ? 'on' : 'off'}`}>
            <span className="conn-dot" />
            {socketStatus === 'connected' ? 'connected' : socketStatus}
          </div>
        </div>

        <div className="contact-scroll">
          {loadingContacts ? (
            <>{Array.from({ length: 5 }).map((_, i) => <ContactSkeleton key={i} />)}</>
          ) : contactList.length === 0 ? (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon">💬</div>
              <p>No conversations yet</p>
              <span>Book a Text Q&amp;A with a mentor to start chatting.</span>
            </div>
          ) : (
            <ul>
              {contactList.map((contact) => {
                const online = onlineUsers.has(String(contact._id));
                const active = String(selectedContact?._id) === String(contact._id);
                return (
                  <li key={contact._id} className={active ? 'selected' : ''} onClick={() => handleSelectContact(contact)}>
                    <div className="contact-avatar-wrapper">
                      <img className="contact-avatar" src={avatarFor(contact.profilePicture, contact.username || contact.name)}
                        alt={contact.username || contact.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = avatarFor(null, contact.username || contact.name); }} />
                      {online && <span className="online-dot" title="Online" />}
                    </div>
                    <div className="contact-info">
                      <div className="contact-row-top">
                        <span className="contact-name">{contact.username || contact.name || 'Unknown'}</span>
                        {contact.lastMessageAt && <span className="contact-time">{formatTime(contact.lastMessageAt)}</span>}
                      </div>
                      <div className="contact-row-bottom">
                        <span className="contact-preview">
                          {contact.lastSenderIsMe ? 'You: ' : ''}{contact.lastMessage || (typeof contact.role === 'string' ? contact.role : 'Mentor')}
                        </span>
                        {contact.unreadCount > 0 && <span className="unread-badge">{contact.unreadCount}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat window */}
      <section className="chat-window">
        {selectedContact ? (
          <>
            <header className="chat-header">
              <button className="back-btn" onClick={() => { setMobilePane('list'); onBack?.(); }} aria-label="Back">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <img className="chat-header-avatar" src={avatarFor(selectedContact.profilePicture, partnerName)}
                alt={partnerName}
                onError={(e) => { e.target.onerror = null; e.target.src = avatarFor(null, partnerName); }} />
              <div className="chat-header-info">
                <h4>{partnerName}</h4>
                <div className={`presence ${partnerOnline ? 'online' : 'offline'}`}>
                  <span className="presence-dot" />
                  {partnerOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              {!isStudent && (
                <button className="resolve-btn" onClick={handleResolve} title="Mark this conversation resolved">
                  ✓ Resolve
                </button>
              )}
            </header>

            <div className="messages-area" ref={messagesAreaRef}
              onScroll={(e) => { if (e.target.scrollTop === 0) loadMoreMessages(); }}>
              {loadingMessages ? (
                <MessageSkeleton />
              ) : messages.length > 0 ? (
                <>
                  {loadingMore && <div className="loading-more"><span className="mini-spinner" /> Loading earlier messages…</div>}
                  {grouped.map((group) => (
                    <React.Fragment key={group.label}>
                      <div className="date-separator"><span className="date-pill">{group.label}</span></div>
                      {group.items.map((msg, index) => {
                        const senderId = String(msg.sender?._id || msg.sender);
                        const isMine = senderId === String(currentUser.id);
                        const isAuto = msg.isAutoReply === true;
                        if (isAuto) {
                          return (
                            <div key={`${msg._id}-${index}`} className="auto-card">
                              <div className="auto-badge">✨ Automated response</div>
                              <p className="auto-text">{linkifyText(msg.text)}</p>
                              <div className="auto-time">{formatTime(msg.createdAt)}</div>
                            </div>
                          );
                        }
                        return (
                          <div key={`${msg._id}-${index}`} className={`bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                            <div className="bubble">
                              <p className="bubble-text">{linkifyText(msg.text)}</p>
                              <div className="bubble-meta">
                                <span className="bubble-time">{formatTime(msg.createdAt)}</span>
                                {isMine && <Ticks status={msg.status} seen={msg.seen} />}
                              </div>
                              {isMine && msg._id && (
                                <button className="msg-menu-btn" onClick={() => setOpenMenuMsgId(openMenuMsgId === msg._id ? null : msg._id)} aria-label="Message options">⋯</button>
                              )}
                              {openMenuMsgId === msg._id && (
                                <div className="msg-menu" onMouseLeave={() => setOpenMenuMsgId(null)}>
                                  <button onClick={() => handleDeleteMessage(msg._id)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <div className="empty-chat">
                  <div className="empty-illustration">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <h4>Start the conversation</h4>
                  <p>Say hello to {partnerName} and ask your first question.</p>
                </div>
              )}
            </div>

            {/* Composer / unlock card */}
            {isStudent && !entitlement.loading && !entitlement.allowed ? (
              <div className="unlock-card">
                <div className="unlock-glow" />
                <div className="unlock-content">
                  <div className="unlock-lock">🔒</div>
                  <div className="unlock-texts">
                    <div className="unlock-title">
                      {entitlement.expired ? `Chat access ended with ${partnerName}` : `Unlock chat with ${partnerName}`}
                    </div>
                    <div className="unlock-sub">
                      {entitlement.expired
                        ? 'Your session window has closed. Book again to continue asking questions.'
                        : 'To ask questions and receive personalized guidance, book a Q&A session with this mentor.'}
                    </div>
                  </div>
                  <button className="unlock-btn" onClick={handleBookSession}>Book Session</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="composer">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder={socketStatus === 'connected' ? 'Type a message' : 'Connecting…'}
                  rows={1}
                  className="composer-input"
                  disabled={!canSend && entitlement.loading}
                />
                <button type="submit" className="send-btn" aria-label="Send"
                  disabled={!newMessage.trim() || !canSend || sending}>
                  {sending
                    ? <span className="mini-spinner light" />
                    : <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" /></svg>}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-illustration big">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h4>Select a conversation</h4>
            <p>Pick a mentor from the list to view your messages.</p>
            {error && <p className="error-text">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatPage;
