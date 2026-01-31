/**
 * Configuration file for White Label Branding
 * Change these values to customize the look and feel for a specific company.
 */
export const BRANDING = {
    // The name of the company displayed in the browser tab and login page
    companyName: "Nome Azienda S.p.A.",

    // Path to the main logo image (place file in client/public folder)
    // Use a high-quality transparent PNG.
    logoPath: "/logo.png",

    // Path to a smaller icon for the AI assistant and sidebar (place file in client/public folder)
    iconPath: "/logo-small.png",

    // Configuration for the AI Assistant
    aiAssistant: {
        name: "Assistant Pro",
        welcomeMessage: "👋 Ciao! Sono l'assistente virtuale di **Nome Azienda**.\n\nPosso aiutarti ad analizzare le chat e risolvere problemi operativi. Come posso esserti utile oggi?"
    },

    // Optional: Primary color for buttons/highlights (if we want to use inline styles later)
    colors: {
        primary: "#2563eb", // Default blue-600
        secondary: "#9333ea" // Default purple-600
    }
};
