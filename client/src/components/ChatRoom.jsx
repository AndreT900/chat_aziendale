import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { socket, API_URL } from '../config/socket';

const ChatRoom = ({ conversation, onNewGroupCreated, onConversationUpdate, onConversationArchived }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isFlash, setIsFlash] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const messagesEndRef = useRef(null);

    // Local state for conversation data (updates when flash events arrive)
    const [conversationData, setConversationData] = useState(conversation);

    // Update local state when prop changes
    useEffect(() => {
        setConversationData(conversation);
    }, [conversation]);

    // Check if user is prod_manager (can send flash)
    const canSendFlash = user.role === 'prod_manager';

    // Check if user is the flash sender (using local state)
    const isFlashSender = conversationData.flashSentBy === user._id ||
        conversationData.flashSentBy?._id === user._id;

    // Check if conversation has active flash that user needs to acknowledge
    const needsToAcknowledge = conversationData.hasActiveFlash && !isFlashSender;

    // Check if chat is locked for current user
    const chatLocked = conversationData.hasActiveFlash && !isFlashSender;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        socket.emit('join_chat', conversation._id);
        setAcknowledged(false);

        const fetchMessages = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/chat/messages/${conversation._id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setMessages(data);
                scrollToBottom();
            } catch (error) {
                console.error("Errore recupero messaggi", error);
            }
        };

        fetchMessages();

        const handleMessageReceived = (message) => {
            if (message.conversationId === conversation._id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
        };

        const handleFlashSent = (data) => {
            if (data.conversationId === conversation._id) {
                // Update local conversation data with flash info
                if (data.conversation) {
                    setConversationData(data.conversation);
                    // Also notify parent to update sidebar
                    if (onConversationUpdate) {
                        onConversationUpdate(data.conversation);
                    }
                }
            }
        };

        const handleFlashAcknowledged = (data) => {
            if (data.conversation._id === conversation._id) {
                alert(`✅ ${data.acknowledgedBy} ha confermato la lettura. Chat archiviata.`);
                if (onConversationArchived) {
                    onConversationArchived(data.conversation);
                }
                window.location.reload();
            }
        };

        const handleClosureRequested = (data) => {
            if (data.conversation._id === conversation._id) {
                onConversationUpdate && onConversationUpdate(data.conversation);
                alert(`${data.initiator} ha richiesto la chiusura della chat. Approva quando vuoi chiudere.`);
            }
        };

        const handleClosureApproved = (data) => {
            if (data.conversation._id === conversation._id) {
                onConversationUpdate && onConversationUpdate(data.conversation);
                if (data.allApproved) {
                    alert('Chat chiusa e archiviata!');
                    window.location.reload();
                }
            }
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('flash_sent', handleFlashSent);
        socket.on('flash_acknowledged', handleFlashAcknowledged);
        socket.on('closure_requested', handleClosureRequested);
        socket.on('closure_approved', handleClosureApproved);

        return () => {
            socket.off('message_received', handleMessageReceived);
            socket.off('flash_sent', handleFlashSent);
            socket.off('flash_acknowledged', handleFlashAcknowledged);
            socket.off('closure_requested', handleClosureRequested);
            socket.off('closure_approved', handleClosureApproved);
        };
    }, [conversation._id, user.token, onConversationUpdate, onConversationArchived, isFlashSender]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post(`${API_URL}/api/chat/messages`, {
                conversationId: conversation._id,
                content: newMessage,
                isFlash: canSendFlash ? isFlash : false
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setNewMessage('');
            setIsFlash(false);
        } catch (error) {
            console.error("Errore invio messaggio", error);
            alert(error.response?.data?.message || 'Errore invio messaggio');
        }
    };

    const handleAcknowledgeFlash = async () => {
        if (!acknowledged) {
            alert('Devi prima spuntare la casella "Confermo di aver preso visione"');
            return;
        }

        try {
            await axios.post(`${API_URL}/api/chat/messages/acknowledge-flash`, {
                conversationId: conversation._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
        } catch (error) {
            console.error("Errore conferma flash", error);
            alert(error.response?.data?.message || 'Errore durante la conferma');
        }
    };

    const handleEscalateMessage = async (message) => {
        if (!window.confirm('Vuoi creare una chat di gruppo con il Laboratorio includendo questo messaggio?')) {
            return;
        }

        try {
            const { data } = await axios.post(`${API_URL}/api/chat/conversations/escalate`, {
                conversationId: conversation._id,
                messageId: message._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (onNewGroupCreated) {
                onNewGroupCreated(data.conversation);
            }

            alert('✅ Chat di gruppo creata! La vecchia chat rimane attiva.');
        } catch (error) {
            console.error("Errore escalation", error);
            alert(error.response?.data?.message || 'Errore durante la creazione del gruppo');
        }
    };

    const handleCloseChat = async () => {
        if (conversation.status === 'closure_requested') {
            if (!window.confirm('Vuoi approvare la chiusura di questa chat?')) {
                return;
            }

            try {
                await axios.post(`${API_URL}/api/chat/conversations/approve-close`, {
                    conversationId: conversation._id
                }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            } catch (error) {
                console.error("Errore approvazione chiusura", error);
                alert(error.response?.data?.message || 'Errore durante l\'approvazione');
            }
        } else {
            if (!window.confirm('Vuoi richiedere la chiusura di questa chat? Tutti i partecipanti devono approvarla.')) {
                return;
            }

            try {
                await axios.post(`${API_URL}/api/chat/conversations/request-close`, {
                    conversationId: conversation._id
                }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                alert('Richiesta di chiusura inviata. Aspetta che tutti i partecipanti approvino.');
            } catch (error) {
                console.error("Errore richiesta chiusura", error);
                alert(error.response?.data?.message || 'Errore durante la richiesta di chiusura');
            }
        }
    };

    const closureApprovalCount = conversationData.closureApprovals?.length || 0;
    const totalParticipants = conversationData.participants?.length || 0;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header Chat */}
            <div className="bg-white border-b p-4 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-gray-800">
                        {conversation.title || (conversation.type === 'direct' ? 'Chat Diretta' : 'Gruppo')}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({conversation.participants.map(p => p.username).join(', ')})
                        </span>
                    </h2>
                    {conversationData.status === 'closure_requested' && (
                        <p className="text-xs text-orange-600 mt-1">
                            ⏳ Chiusura richiesta ({closureApprovalCount}/{totalParticipants} approvazioni)
                        </p>
                    )}
                    {conversationData.hasActiveFlash && (
                        <p className="text-xs text-yellow-600 mt-1 font-semibold">
                            ⚡ Flash Message attivo - Chat in sola lettura
                        </p>
                    )}
                </div>
                {!conversationData.hasActiveFlash && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCloseChat}
                            className={`text-sm px-3 py-1 rounded transition ${conversationData.status === 'closure_requested'
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'text-red-500 hover:text-red-700'
                                }`}
                        >
                            {conversationData.status === 'closure_requested' ? 'Approva Chiusura' : 'Chiudi Chat'}
                        </button>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender._id === user._id;
                    const isFlashMsg = msg.isFlash;
                    const canEscalate = user.role === 'prod_manager' && conversationData.type === 'direct' && !conversationData.hasActiveFlash;

                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                            <div className="flex items-start gap-2">
                                {/* Flash messages always have yellow background and dark text for readability */}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${isFlashMsg
                                    ? 'bg-yellow-100 text-gray-800 border-2 border-yellow-400'
                                    : (isMe ? 'bg-accent text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none')
                                    }`}>

                                    <div className={`text-xs mb-1 flex justify-between ${isFlashMsg ? 'text-yellow-700' : 'opacity-75'}`}>
                                        <span className="font-bold mr-2">{msg.sender.username}</span>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {isFlashMsg && (
                                        <div className="flex items-center text-yellow-700 font-semibold mb-1">
                                            <span className="mr-1">⚡ FLASH MESSAGE</span>
                                        </div>
                                    )}

                                    <p className={isFlashMsg ? 'text-gray-800' : (isMe ? 'text-white' : 'text-gray-800')}>{msg.content}</p>
                                </div>

                                {/* 3-dot menu for escalation */}
                                {canEscalate && (
                                    <button
                                        onClick={() => handleEscalateMessage(msg)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                                        title="Apri chat con Laboratorio"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <circle cx="10" cy="4" r="1.5" />
                                            <circle cx="10" cy="10" r="1.5" />
                                            <circle cx="10" cy="16" r="1.5" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Flash Acknowledgment Panel - Show only to non-sender when flash is active */}
            {needsToAcknowledge && (
                <div className="p-4 bg-yellow-100 border-t-2 border-yellow-400">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <p className="font-bold text-yellow-800">Flash Message Ricevuto</p>
                                <p className="text-sm text-yellow-700">Conferma la presa visione per archiviare la chat.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="w-5 h-5 accent-yellow-600"
                                />
                                <span className="text-sm text-yellow-800 font-medium">Confermo di aver preso visione</span>
                            </label>
                            <button
                                onClick={handleAcknowledgeFlash}
                                disabled={!acknowledged}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                ✓ Letto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area - Show only if not locked or if user is flash sender */}
            {(!chatLocked || isFlashSender) && !needsToAcknowledge && (
                <form onSubmit={sendMessage} className="p-4 bg-white border-t flex items-center space-x-2">
                    {/* Flash checkbox - Only for prod_manager */}
                    {canSendFlash && (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="flash"
                                checked={isFlash}
                                onChange={(e) => setIsFlash(e.target.checked)}
                                className="mr-2 accent-yellow-500"
                            />
                            <label htmlFor="flash" className="text-sm text-yellow-600 select-none cursor-pointer font-medium">
                                ⚡ Flash
                            </label>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Scrivi un messaggio..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-accent text-white rounded-full p-2 px-6 hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        Invia
                    </button>
                </form>
            )}

            {/* Locked message for non-flash-sender */}
            {chatLocked && !isFlashSender && !needsToAcknowledge && (
                <div className="p-4 bg-gray-200 border-t text-center text-gray-600">
                    🔒 Chat bloccata in attesa di conferma lettura del Flash Message.
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
