const Groq = require('groq-sdk');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Query AI Assistant - Only for admin users
 */
exports.queryAI = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato. Solo la Direzione può usare l\'AI Assistant.' });
        }

        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: 'Query non valida' });
        }

        // Fetch all conversations with titles (article codes)
        const conversations = await Conversation.find({
            title: { $exists: true, $ne: null }
        })
            .populate('participants', 'username role department')
            .sort({ updatedAt: -1 })
            .limit(200); // Limit to recent 200 conversations

        // Fetch messages for these conversations
        const conversationIds = conversations.map(c => c._id);
        const messages = await Message.find({
            conversationId: { $in: conversationIds }
        })
            .populate('sender', 'username role')
            .sort({ createdAt: 1 });

        // Prepare context for AI
        const context = prepareContextForAI(conversations, messages);

        // Query Groq
        const aiResponse = await queryGroq(query, context);

        res.json({
            answer: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Errore AI Query:', error);
        res.status(500).json({
            message: 'Errore durante l\'elaborazione della richiesta AI',
            error: error.message
        });
    }
};

/**
 * Prepare structured context from conversations and messages
 */
function prepareContextForAI(conversations, messages) {
    const conversationData = conversations.map(conv => {
        const convMessages = messages.filter(
            m => m.conversationId.toString() === conv._id.toString()
        );

        return {
            codiceArticolo: conv.title,
            stato: conv.status,
            dataCreazione: conv.createdAt,
            dataUltimoAggiornamento: conv.updatedAt,
            archiviata: conv.status === 'closed',
            partecipanti: conv.participants.map(p => ({
                nome: p.username,
                ruolo: p.role,
                dipartimento: p.department
            })),
            messaggi: convMessages.map(m => ({
                mittente: m.sender.username,
                ruolo: m.sender.role,
                contenuto: m.content,
                data: m.createdAt,
                isFlash: m.isFlash || false
            })),
            numeroMessaggi: convMessages.length
        };
    });

    return {
        totaleConversazioni: conversations.length,
        conversazioni: conversationData
    };
}

/**
 * Query Groq with context
 */
async function queryGroq(userQuery, context) {
    try {
        const systemPrompt = `Sei un assistente AI per l'analisi delle chat aziendali di produzione.
Il tuo compito è analizzare le conversazioni tra il team di produzione, i responsabili e il laboratorio.

CONTESTO DEL DATABASE:
${JSON.stringify(context, null, 2)}

ISTRUZIONI:
1. Rispondi SEMPRE in italiano
2. Fornisci risposte precise basate SOLO sui dati forniti
3. Se non hai abbastanza informazioni, dillo chiaramente
4. Usa un tono professionale ma accessibile
5. Quando possibile, fornisci statistiche e numeri concreti
6. Identifica pattern e problemi ricorrenti
7. Per i report su articoli specifici, includi: stato, partecipanti, cronologia messaggi, problemi emersi, soluzioni proposte`;

        // Using Llama 3.3 70B Versatile (latest, super fast)
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userQuery
                }
            ],
            temperature: 0.3,
            max_tokens: 2048,
            top_p: 0.95
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Errore Groq API:', error);
        throw new Error('Errore nella comunicazione con Groq: ' + error.message);
    }
}

/**
 * Get AI statistics - Summary of available data
 */
exports.getAIStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato' });
        }

        const totalConversations = await Conversation.countDocuments({ title: { $exists: true } });
        const activeConversations = await Conversation.countDocuments({
            title: { $exists: true },
            status: 'active'
        });
        const closedConversations = await Conversation.countDocuments({
            title: { $exists: true },
            status: 'closed'
        });
        const totalMessages = await Message.countDocuments();

        res.json({
            totalConversations,
            activeConversations,
            closedConversations,
            totalMessages,
            aiReady: true
        });

    } catch (error) {
        res.status(500).json({ message: 'Errore recupero statistiche', error: error.message });
    }
};
