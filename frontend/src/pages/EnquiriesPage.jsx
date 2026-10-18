import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  CheckCircle2, 
  Clock,
  Wifi,
  WifiOff,
  User,
  RefreshCw,
  Home,
  AlertCircle,
  ExternalLink,
  LogIn
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { 
  fetchConversations, 
  fetchMessages, 
  sendConversationMessage, 
  createOrGetConversation,
  fetchRooms
} from '../services/api';

export const EnquiriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, token, isAuthenticated, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [initializingRoomEnquiry, setInitializingRoomEnquiry] = useState(false);

  const socketRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const messagesEndRef = useRef(null);

  // Keep activeChatIdRef in sync for socket listener callbacks
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Socket.IO connection whenever authenticated
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      return;
    }

    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setErrorBanner(null);
      if (activeChatIdRef.current) {
        socket.emit('join_room', { conversationId: activeChatIdRef.current });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      setSocketConnected(false);
      console.warn('[Socket.IO] Connection notice:', err.message);
    });

    // Real-time incoming message receiver
    socket.on('receive_message', (incomingMsg) => {
      // Update conversations preview
      setConversations((prev) =>
        prev.map((c) => {
          const cId = c._id || c.id;
          if (cId === incomingMsg.conversationId) {
            return {
              ...c,
              lastMessage: incomingMsg.text,
              lastMessageAt: incomingMsg.createdAt,
            };
          }
          return c;
        })
      );

      // Append to active chat if message belongs to current thread
      if (activeChatIdRef.current === incomingMsg.conversationId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => (m.id || m._id) === (incomingMsg.id || incomingMsg._id)
          );
          if (exists) return prev;
          return [...prev, incomingMsg];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Load conversations from backend
  const loadConversations = async (targetIdToSelect = null) => {
    if (!token) {
      setLoadingConversations(false);
      return;
    }
    setLoadingConversations(true);

    try {
      const convList = await fetchConversations(token);
      setConversations(convList);

      const targetId = targetIdToSelect || searchParams.get('conversationId');
      if (targetId && convList.some((c) => (c._id || c.id) === targetId)) {
        setActiveChatId(targetId);
      } else if (convList.length > 0 && !activeChatId) {
        setActiveChatId(convList[0]._id || convList[0].id);
      }
    } catch (err) {
      console.warn('[Enquiries] Failed to load conversations:', err.message);
      setErrorBanner('Could not load conversations. Please refresh or check connection.');
    } finally {
      setLoadingConversations(false);
    }
  };

  // Handle roomId query param to automatically start or open conversation with owner
  useEffect(() => {
    if (!token) return;

    const roomIdParam = searchParams.get('roomId');
    if (!roomIdParam) {
      loadConversations();
      return;
    }

    async function handleRoomParam() {
      setInitializingRoomEnquiry(true);
      setErrorBanner(null);
      try {
        const conv = await createOrGetConversation({ roomId: roomIdParam }, token);
        const convId = conv._id || conv.id;
        
        // Remove roomId from search params and replace with conversationId
        setSearchParams({ conversationId: convId });
        setActiveChatId(convId);
        
        await loadConversations(convId);
      } catch (err) {
        console.error('[Enquiries] Failed to start enquiry for room:', err);
        setErrorBanner(err.message || 'Could not start enquiry for this room.');
        await loadConversations();
      } finally {
        setInitializingRoomEnquiry(false);
      }
    }

    handleRoomParam();
  }, [token, searchParams.get('roomId')]);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    if (!activeChatId || !token) return;

    let isMounted = true;
    setLoadingMessages(true);

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { conversationId: activeChatId });
    }

    fetchMessages(activeChatId, token)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
          setLoadingMessages(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[Enquiries] Failed to fetch messages:', err.message);
          setLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeChatId, token]);

  // Helper: Start enquiry from the first available room in DB if user wants to test
  const handleStartRoomEnquiry = async () => {
    if (!token) return;
    setLoadingConversations(true);
    setErrorBanner(null);
    try {
      const rooms = await fetchRooms();
      const firstRoom = rooms.find((r) => {
        const ownerId = r.owner?._id || r.owner?.id || r.owner;
        const myId = currentUser?._id || currentUser?.id;
        return ownerId && myId && ownerId.toString() !== myId.toString();
      }) || rooms[0];

      if (!firstRoom) {
        setErrorBanner('No available room listings found to enquire with. Try browsing rooms first.');
        setLoadingConversations(false);
        return;
      }

      const conv = await createOrGetConversation({ roomId: firstRoom._id || firstRoom.id }, token);
      const convId = conv._id || conv.id;

      await loadConversations(convId);
      setActiveChatId(convId);
      setSearchParams({ conversationId: convId });
    } catch (err) {
      setErrorBanner(`Failed to start enquiry: ${err.message}`);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Handle message sending (via Socket.IO with HTTP fallback)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !activeChatId || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      _id: tempId,
      conversationId: activeChatId,
      sender: {
        id: currentUser?._id || currentUser?.id,
        _id: currentUser?._id || currentUser?.id,
        fullName: currentUser?.fullName || 'Me',
        avatar: currentUser?.avatar,
      },
      text: trimmed,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'send_message',
          { conversationId: activeChatId, text: trimmed },
          (response) => {
            if (response?.success && response.data) {
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? response.data : m))
              );
            }
          }
        );
      } else {
        const sent = await sendConversationMessage(activeChatId, trimmed, token);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? sent : m))
        );
      }
    } catch (err) {
      console.error('[Enquiries] Failed to send message:', err);
      setErrorBanner('Failed to send message. Please retry.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const activeChat = conversations.find(
    (c) => (c._id || c.id) === activeChatId
  );

  // Helper to extract other participant info
  const getOtherParticipant = (conv) => {
    if (!conv?.participants || !Array.isArray(conv.participants)) {
      return { fullName: 'Property Host', role: 'landlord', avatar: null };
    }
    const currentId = currentUser?._id || currentUser?.id;
    const other = conv.participants.find(
      (p) => {
        const pId = p._id || p.id || p;
        return pId && currentId && pId.toString() !== currentId.toString();
      }
    );
    return other || conv.participants[0] || { fullName: 'Member', role: 'landlord' };
  };

  const otherParticipant = activeChat ? getOtherParticipant(activeChat) : null;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const isMyMessage = (m) => {
    const currentId = currentUser?._id || currentUser?.id;
    const senderId = m.sender?._id || m.sender?.id || m.sender;
    return Boolean(currentId && senderId && currentId.toString() === senderId.toString());
  };

  // If user is not authenticated, show sign-in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-100">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink-primary mb-3">Sign in to view your messages</h1>
        <p className="text-sm text-ink-secondary max-w-md mx-auto mb-8">
          Enquiries, landlord direct chats, and flatmate visit coordinates are private and securely stored in your account.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            icon={LogIn}
            onClick={() => navigate('/login?redirect=/messages')}
          >
            Sign in to RoomSync
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/signup')}
          >
            Create an Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-4">
      
      {/* Top Status & Context Bar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-semibold">
            {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink-primary">
                {currentUser?.fullName || 'Signed-in User'}
              </span>
              <Badge variant="teal" size="sm" className="capitalize">
                {currentUser?.role === 'owner' ? 'Property Owner' : 'Room Seeker'}
              </Badge>
              {currentUser?.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" title="Verified Member" />
              )}
            </div>
            <p className="text-[11px] text-ink-tertiary">{currentUser?.email}</p>
          </div>
        </div>

        {/* Live Socket Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 text-[11px]">
            {socketConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-medium">Socket.IO Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-ink-secondary">Connecting real-time socket...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error alert banner if present */}
      {errorBanner && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-rose-500 hover:text-rose-700 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-apple overflow-hidden flex flex-col md:flex-row h-[720px]">
        
        {/* Left Column: Conversation List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-surface-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-surface-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Enquiries & Messages</h2>
              <p className="text-xs text-ink-secondary">Direct chats with verified property owners & flatmates</p>
            </div>
            <button
              onClick={() => loadConversations()}
              className="p-1.5 text-ink-secondary hover:text-ink-primary rounded-lg hover:bg-surface-100 transition-colors"
              title="Refresh conversations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-surface-200">
            {loadingConversations || initializingRoomEnquiry ? (
              <div className="p-8 text-center text-xs text-ink-secondary space-y-2">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>{initializingRoomEnquiry ? 'Opening room enquiry...' : 'Loading conversations...'}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-secondary space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-primary">No conversations yet</p>
                  <p className="text-[11px] text-ink-tertiary mt-1">
                    Explore available rooms to send a message to a property owner or flatmate.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center text-xs mt-2"
                  onClick={() => navigate('/rooms')}
                >
                  Explore Rooms
                </Button>
              </div>
            ) : (
              conversations.map((c) => {
                const convId = c._id || c.id;
                const other = getOtherParticipant(c);
                const roomTitle = c.room?.title || 'Listing Enquiry';
                const isActive = activeChatId === convId;

                return (
                  <button
                    key={convId}
                    onClick={() => {
                      setActiveChatId(convId);
                      setSearchParams({ conversationId: convId });
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-surface-50' : 'hover:bg-surface-50/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {other.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-surface-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface-200 text-ink-secondary flex items-center justify-center font-semibold text-sm">
                          {other.fullName ? other.fullName[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm text-ink-primary truncate">
                          {other.fullName}
                        </span>
                        <span className="text-[10px] text-ink-tertiary shrink-0 ml-1">
                          {formatTime(c.lastMessageAt || c.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant={other.role === 'owner' ? 'teal' : 'neutral'} size="sm">
                          {other.role === 'owner' ? 'Owner' : 'Seeker'}
                        </Badge>
                        <span className="text-[11px] text-ink-secondary truncate">
                          {roomTitle}
                        </span>
                      </div>
                      <p className="text-xs text-ink-tertiary truncate">
                        {c.lastMessage || 'Conversation started'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="flex-1 flex flex-col bg-surface-50/40">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-surface-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {otherParticipant?.avatar ? (
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-brand-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-semibold shrink-0">
                      {otherParticipant?.fullName ? otherParticipant.fullName[0].toUpperCase() : 'H'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-ink-primary truncate">
                        {otherParticipant?.fullName || 'Property Owner'}
                      </h3>
                      {otherParticipant?.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" title="Verified Member" />
                      )}
                      <Badge variant="teal" size="sm">
                        {otherParticipant?.role === 'owner' ? 'Landlord' : 'Seeker'}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-secondary truncate">
                      {activeChat.room?.title || 'Residential Listing'}
                      {activeChat.room?.city ? ` · ${activeChat.room.city}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeChat.room?._id && (
                    <Link
                      to={`/rooms/${activeChat.room._id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Listing</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {activeChat.room && (
                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-brand-200 shadow-2xs text-xs text-center space-y-2">
                    <div className="inline-flex p-2 rounded-xl bg-brand-50 text-brand-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-sm text-ink-primary">
                      {activeChat.room.title || 'Room Listing Enquiry'}
                    </div>
                    <p className="text-ink-secondary">
                      {activeChat.room.locality ? `${activeChat.room.locality}, ${activeChat.room.city || ''}` : 'Direct conversation regarding property accommodation.'}
                    </p>
                    {activeChat.room.rent && (
                      <div className="pt-1 flex justify-center gap-2">
                        <Badge variant="emerald" size="sm">Rent: ₹{activeChat.room.rent.toLocaleString()}/mo</Badge>
                      </div>
                    )}
                  </div>
                )}

                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-ink-secondary">
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-secondary">
                    <p className="font-medium text-ink-primary">No messages yet in this enquiry</p>
                    <p className="text-[11px] text-ink-tertiary mt-1">
                      Say hello, introduce your move-in schedule, and ask any questions!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = isMyMessage(m);
                    const msgKey = m.id || m._id || `${m.createdAt}-${Math.random()}`;

                    return (
                      <div
                        key={msgKey}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-tr-none'
                              : 'bg-white text-ink-primary border border-surface-200 rounded-tl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-ink-tertiary mt-1 px-1">
                          {formatTime(m.createdAt)}
                          {m.isOptimistic && ' · Sending...'}
                        </span>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-surface-200 flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Type your message or enquiry..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                  className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all disabled:opacity-60"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Send}
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-ink-secondary">
              <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-ink-tertiary mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-ink-primary mb-1">
                Select an enquiry to start chatting
              </h3>
              <p className="max-w-sm text-ink-secondary">
                Choose a conversation from the left sidebar to send and receive real-time messages with verified property owners and flatmates.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
