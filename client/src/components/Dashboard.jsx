import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatRoom from './ChatRoom';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [archivedConversations, setArchivedConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showArticlePrompt, setShowArticlePrompt] = useState(false);
    const [articleCode, setArticleCode] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/chat/conversations', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setConversations(data);
                setLoading(false);
            } catch (error) {
                console.error("Errore recupero chat", error);
                setLoading(false);
            }
        };

        const fetchArchivedConversations = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/chat/conversations/archived', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setArchivedConversations(data);
            } catch (error) {
                console.error("Errore recupero archiviati", error);
            }
        };

        if (user?.token) {
            fetchConversations();
            fetchArchivedConversations();
        }

        // Listen for new group chat creation
        const handleNewGroup = (data) => {
            setConversations(prev => [data.conversation, ...prev]);
            setSelectedChat(data.conversation);
        };

        socket.on('new_group_created', handleNewGroup);

        return () => {
            socket.off('new_group_created', handleNewGroup);
        };
    }, [user]);

    const handleNewGroupCreated = (newConversation) => {
        setConversations(prev => [newConversation, ...prev]);
        setSelectedChat(newConversation);
    };

    const handleConversationUpdate = (updatedConv) => {
        setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
    };

    const openNewChatModal = async () => {
        // For team users, show article prompt first
        if (user.role === 'team') {
            setShowArticlePrompt(true);
            return;
        }

        // For other users, show the modal
        try {
            const { data } = await axios.get('http://localhost:5001/api/chat/users', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAvailableUsers(data);
            setShowNewChatModal(true);
        } catch (error) {
            console.error("Errore recupero utenti", error);
            alert('Errore nel caricamento degli utenti');
        }
    };

    const createChatWithArticleCode = async () => {
        if (!articleCode.trim()) {
            alert('Inserisci il codice articolo');
            return;
        }

        try {
            // Get prod_manager
            const { data: users } = await axios.get('http://localhost:5001/api/chat/users', {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (users.length === 0) {
                alert('Nessun responsabile produzione disponibile');
                return;
            }

            const prodManager = users[0];

            // Create new chat with prod_manager and article code as title
            const { data } = await axios.post('http://localhost:5001/api/chat/conversations', {
                participants: [prodManager._id],
                type: 'direct',
                title: articleCode.trim()
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setConversations(prev => [data, ...prev]);
            setSelectedChat(data);
            setShowArticlePrompt(false);
            setArticleCode('');
        } catch (error) {
            console.error("Errore creazione chat", error);
            alert(error.response?.data?.message || 'Errore durante la creazione della chat');
        }
    };

    const createNewChat = async () => {
        if (selectedUsers.length === 0) {
            alert('Seleziona almeno un utente');
            return;
        }

        try {
            const { data } = await axios.post('http://localhost:5001/api/chat/conversations', {
                participants: selectedUsers,
                type: selectedUsers.length > 1 ? 'group' : 'direct'
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setConversations(prev => [data, ...prev]);
            setSelectedChat(data);
            setShowNewChatModal(false);
            setSelectedUsers([]);
        } catch (error) {
            console.error("Errore creazione chat", error);
            alert(error.response?.data?.message || 'Errore durante la creazione della chat');
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Filter conversations by search term (only for authorized roles)
    const canSearch = ['admin', 'lab_manager', 'prod_manager'].includes(user?.role);

    const baseConversations = showArchived ? archivedConversations : conversations;

    const displayedConversations = canSearch && searchTerm.trim()
        ? baseConversations.filter(chat =>
            chat.title && chat.title.toUpperCase().includes(searchTerm.toUpperCase())
        )
        : baseConversations;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-secondary text-white flex flex-col shadow-xl z-10">
                <div className="p-4 font-bold text-xl border-b border-slate-600 bg-primary flex justify-between items-center">
                    <span>Chat Aziendale</span>
                    <button
                        onClick={openNewChatModal}
                        className="bg-accent text-xs px-3 py-1 rounded hover:bg-blue-600"
                    >
                        + Nuova Chat
                    </button>
                </div>

                <div className="px-4 py-3 bg-slate-800 text-sm">
                    <p className="text-gray-300">Utente: <span className="text-white font-semibold">{user?.username}</span></p>
                    <p className="text-gray-400 text-xs uppercase">{user?.role}</p>
                </div>

                {/* Toggle Active/Archived */}
                <div className="flex border-b border-slate-600">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`flex-1 py-2 text-sm transition ${!showArchived ? 'bg-slate-700 text-white' : 'text-gray-400 hover:bg-slate-700/50'}`}
                    >
                        Attive ({conversations.length})
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={`flex-1 py-2 text-sm transition ${showArchived ? 'bg-slate-700 text-white' : 'text-gray-400 hover:bg-slate-700/50'}`}
                    >
                        Archiviate ({archivedConversations.length})
                    </button>
                </div>

                {/* Search Field - Only for admin, lab_manager, prod_manager */}
                {canSearch && (
                    <div className="px-3 py-2 bg-slate-700 border-b border-slate-600">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="🔍 Cerca per codice articolo..."
                                className="w-full px-3 py-2 pr-8 bg-slate-600 text-white placeholder-gray-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent uppercase"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    title="Cancella ricerca"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {searchTerm.trim() && (
                            <p className="text-xs text-gray-400 mt-1">
                                {displayedConversations.length} {displayedConversations.length === 1 ? 'risultato' : 'risultati'}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? <p className="text-center text-gray-400 p-4">Caricamento...</p> :
                        displayedConversations.length === 0 ?
                            <p className="text-center text-gray-400 p-4 text-sm">
                                {searchTerm.trim()
                                    ? `Nessuna chat trovata con il codice "${searchTerm}"`
                                    : (showArchived ? 'Nessuna chat archiviata' : 'Nessuna chat attiva')
                                }
                            </p> :
                            displayedConversations.map(chat => (
                                <div
                                    key={chat._id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-3 rounded cursor-pointer transition-colors border-b border-slate-600/50 ${selectedChat?._id === chat._id ? 'bg-accent text-white' : 'hover:bg-slate-600 text-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold text-sm flex items-center justify-between">
                                        <span>{chat.title || (chat.type === 'group' ? '👥 Gruppo' : '👤 Privata')}</span>
                                        {chat.status === 'closure_requested' && (
                                            <span className="text-xs bg-orange-500 px-2 py-0.5 rounded">Chiusura richiesta</span>
                                        )}
                                    </div>
                                    <div className="text-xs truncate opacity-80">
                                        {chat.participants.map(p => p.username).join(', ')}
                                    </div>
                                </div>
                            ))}
                </div>

                <div className="p-4 border-t border-slate-600 bg-primary space-y-2">
                    {/* Admin button - only visible to admin users */}
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full py-2 bg-blue-600/80 hover:bg-blue-600 rounded text-sm transition-colors text-white font-medium"
                        >
                            👨‍💼 Gestisci Utenti
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="w-full py-2 bg-red-600/80 hover:bg-red-600 rounded text-sm transition-colors text-white font-medium"
                    >
                        Esci
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-100 relative">
                {selectedChat ? (
                    <ChatRoom
                        conversation={selectedChat}
                        key={selectedChat._id}
                        onNewGroupCreated={handleNewGroupCreated}
                        onConversationUpdate={handleConversationUpdate}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="text-8xl mb-6 bg-white p-6 rounded-full shadow-sm">💬</div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Benvenuto in Chat Aziendale</h2>
                        <p className="text-lg max-w-md">Seleziona una conversazione presente nella barra laterale o creane una nuova per iniziare a collaborare.</p>
                        <button
                            onClick={openNewChatModal}
                            className="mt-8 bg-accent text-white px-6 py-3 rounded-full hover:bg-blue-600 transition shadow-md font-medium"
                        >
                            + Inizia una nuova chat
                        </button>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[600px] flex flex-col">
                        <h2 className="text-xl font-bold mb-4">Nuova Chat</h2>

                        <p className="text-sm text-gray-600 mb-3">Seleziona gli utenti con cui chattare:</p>

                        <div className="flex-1 overflow-y-auto border rounded p-2 mb-4 space-y-1">
                            {availableUsers.map(availUser => (
                                <label
                                    key={availUser._id}
                                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(availUser._id)}
                                        onChange={() => toggleUserSelection(availUser._id)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium">{availUser.username}</div>
                                        <div className="text-xs text-gray-500 capitalize">{availUser.role}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                            {selectedUsers.length > 0
                                ? `${selectedUsers.length} utente${selectedUsers.length > 1 ? 'i' : ''} selezionato${selectedUsers.length > 1 ? 'i' : ''}`
                                : 'Nessun utente selezionato'}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowNewChatModal(false);
                                    setSelectedUsers([]);
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={createNewChat}
                                disabled={selectedUsers.length === 0}
                                className="flex-1 py-2 bg-accent text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Crea Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Code Prompt Modal */}
            {showArticlePrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Quale articolo?</h2>

                        <p className="text-sm text-gray-600 mb-3">Inserisci il codice interno dell'articolo:</p>

                        <input
                            type="text"
                            value={articleCode}
                            onChange={(e) => setArticleCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && createChatWithArticleCode()}
                            placeholder="ES: ART-12345"
                            className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-accent uppercase"
                            autoFocus
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowArticlePrompt(false);
                                    setArticleCode('');
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={createChatWithArticleCode}
                                disabled={!articleCode.trim()}
                                className="flex-1 py-2 bg-accent text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Crea Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

