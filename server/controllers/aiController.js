const Groq = require('groq-sdk');
const OpenAI = require('openai');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Initialize Clients
let groqClient, openaiClient;

if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Configuration
const PROVIDER = process.env.AI_PROVIDER || 'groq';

/**
 * Unified AI Request Handler (Groq / OpenAI)
 */
async function makeAIRequest(userQuery, context) {
    const systemPrompt = `Sei un assistente AI per l'analisi delle chat aziendali di produzione.
Il tuo compito è analizzare le conversazioni tra il team di produzione, i responsabili e il laboratorio.

CONTESTO DEL DATABASE:
${JSON.stringify(context, null, 2)}

ISTRUZIONI FONDAMENTALI (GUARDRAILS):
1. **SOURCE OF TRUTH**: Rispondi ESCLUSIVAMENTE basandoti sui dati forniti nel "CONTESTO DEL DATABASE". NON inventare nulla e NON usare conoscenze esterne.
2. **VERIFICA ARTICOLO**: Se la domanda riguarda un articolo specifico, CERCA PRIMA il codice nel database fornito.
   - Se il codice NON è presente: Rispondi "Non ho trovato nessuna conversazione o segnalazione relativa al codice [CODICE] nel database."
   - Se il codice è presente: Procedi con l'analisi.
3. **AMBITO RISTRETTO**: Puoi rispondere SOLO a domande riguardanti: analisi chat, problemi di produzione, articoli, stato lavorazioni e dinamiche tra i reparti (Team, Lab, Prod).
   - Se la domanda è fuori tema (es. meteo, politica, ricette), rispondi: "Posso rispondere solo a domande relative alle chat aziendali e ai problemi di produzione."
4. **STILE RISPOSTA**:
   - Rispondi SEMPRE in italiano.
   - Fornisci RIASSUNTI DISCORSIVI e NATURALI (non elenchi puntati robotici).
   - Racconta l'accaduto come se parlassi a un collega.
5. **GESTIONE CHAT GRUPPO**:
   - Analizza le chat "Gruppo"/"Escalation" per dedurne il codice articolo dal contesto.
   - Uniscile mentalmente allo storico dell'articolo corretto.
6. **STORICO**: Includi SEMPRE le chat ARCHIVIATE (closed) nell'analisi.
7. **CHIUSURA**: Se c'è un problema, spiega chi è coinvolto, cosa è successo e come/se è stato risolto.`;

    try {
        let responseContent = '';

        if (PROVIDER === 'openai') {
            if (!openaiClient) throw new Error('OpenAI API Key mancante');

            console.log('🤖 Using Provider: OpenAI');
            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o", // O gpt-4-turbo
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuery }
                ],
                temperature: 0.1,
                max_tokens: 2048
            });
            responseContent = completion.choices[0].message.content;

        } else {
            // Default to Groq
            if (!groqClient) throw new Error('Groq API Key mancante');

            console.log('⚡ Using Provider: Groq');
            const completion = await groqClient.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuery }
                ],
                temperature: 0.1,
                max_tokens: 2048
            });
            responseContent = completion.choices[0].message.content;
        }

        return responseContent;

    } catch (error) {
        console.error(`Errore Provider AI (${PROVIDER}):`, error);
        throw new Error(`Errore comunicazione con ${PROVIDER}: ` + error.message);
    }
}

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
 * Query AI Assistant - Only for admin users
 */
exports.queryAI = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato. Solo la Direzione può usare l\'AI Assistant.' });
        }

        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: 'Query non valida' });
        }

        // Fetch conversations (increased limit and relaxed filter to include archived/group chats)
        const conversations = await Conversation.find({
            $or: [
                { title: { $exists: true, $ne: null } },
                { type: 'group' }
            ]
        })
            .populate('participants', 'username role department')
            .sort({ updatedAt: -1 })
            .limit(1000);

        // Fetch messages for these conversations
        const conversationIds = conversations.map(c => c._id);
        const messages = await Message.find({
            conversationId: { $in: conversationIds }
        })
            .populate('sender', 'username role')
            .sort({ createdAt: 1 });

        // Prepare context for AI
        const context = prepareContextForAI(conversations, messages);

        // --- AI REQUEST ---
        const aiResponse = await makeAIRequest(query, context);

        res.json({
            answer: aiResponse,
            provider: PROVIDER,
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
