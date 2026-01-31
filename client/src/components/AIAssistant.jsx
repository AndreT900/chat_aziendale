import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/socket';
import { BRANDING } from '../config/branding';

const AIAssistant = ({ onClose }) => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const messagesEndRef = useRef(null);

    // Suggested queries
    const suggestedQueries = [
        "Quanti articoli hanno avuto problemi questo mese?",
        "Quali sono gli articoli con più segnalazioni?",
        "Ci sono problemi aperti non risolti?",
        "Mostrami le statistiche generali",
        "Quali problemi sono stati risolti questa settimana?"
    ];

    useEffect(() => {
        fetchStats();
        // Welcome message
        setMessages([{
            role: 'assistant',
            content: BRANDING.aiAssistant.welcomeMessage,
            timestamp: new Date()
        }]);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/ai/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Errore recupero statistiche AI:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/api/ai/query`,
                { query },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const aiMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: new Date(data.timestamp)
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Errore query AI:', error);
            const errorMessage = {
                role: 'assistant',
                content: '❌ Mi dispiace, si è verificato un errore durante l\'elaborazione della tua richiesta. Riprova tra poco.',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestedQuery = (suggestedQuery) => {
        setQuery(suggestedQuery);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Custom Icon or Default Emoji */}
                        <div className="h-10 w-10 flex items-center justify-center bg-white/20 rounded-full overflow-hidden">
                            <img
                                src={BRANDING.iconPath}
                                alt="AI"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-2xl">✨</span>';
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{BRANDING.aiAssistant.name}</h2>
                            <p className="text-sm opacity-90">Powered by Groq Llama 3.3 70B</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stats Bar */}
                {stats && (
                    <div className="bg-gray-50 px-6 py-3 border-b grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalConversations}</div>
                            <div className="text-xs text-gray-600">Totale Chat</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{stats.activeConversations}</div>
                            <div className="text-xs text-gray-600">Attive</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">{stats.closedConversations}</div>
                            <div className="text-xs text-gray-600">Archiviate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
                            <div className="text-xs text-gray-600">Messaggi</div>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : msg.isError
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-white text-gray-800 shadow-md'
                                    }`}
                            >
                                <div className="prose prose-sm max-w-none">
                                    {msg.content.split('\n').map((line, i) => {
                                        // Simple markdown-like rendering
                                        if (line.startsWith('**') && line.endsWith('**')) {
                                            return <p key={i} className="font-bold">{line.slice(2, -2)}</p>;
                                        }
                                        if (line.startsWith('- ')) {
                                            return <li key={i} className="ml-4">{line.slice(2)}</li>;
                                        }
                                        return line ? <p key={i}>{line}</p> : <br key={i} />;
                                    })}
                                </div>
                                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className="animate-bounce">🤔</div>
                                    <span className="text-gray-600">Sto analizzando...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Queries */}
                {messages.length <= 1 && !loading && (
                    <div className="px-6 py-3 bg-white border-t">
                        <p className="text-xs text-gray-500 mb-2">💡 Domande suggerite:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQueries.map((sq, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestedQuery(sq)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition"
                                >
                                    {sq}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-6 bg-white border-t rounded-b-2xl">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Fai una domanda... (es: Quanti articoli hanno avuto problemi?)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || loading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? '⏳' : '🚀'} Invia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AIAssistant;
