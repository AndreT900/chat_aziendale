import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/socket';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form states
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'team', department: '' });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            alert('Accesso negato. Solo gli admin possono accedere.');
            navigate('/');
            return;
        }
        fetchUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error("Errore recupero utenti", error);
            alert(error.response?.data?.message || 'Errore caricamento utenti');
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/admin/users`, newUser, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('✅ Utente creato con successo!');
            setNewUser({ username: '', password: '', role: 'team', department: '' });
            setShowAddModal(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Errore creazione utente');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Sei sicuro di voler eliminare l'utente "${username}"? Questa azione è irreversibile.`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('✅ Utente eliminato con successo');
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Errore eliminazione utente');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                `${API_URL}/api/admin/users/${selectedUser._id}/password`,
                { newPassword },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert('✅ Password aggiornata con successo!');
            setNewPassword('');
            setShowPasswordModal(false);
            setSelectedUser(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Errore aggiornamento password');
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-600';
            case 'prod_manager': return 'bg-blue-600';
            case 'lab_manager': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">👨‍💼 Pannello Amministrazione</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/')}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                            >
                                ← Torna alla Chat
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                            >
                                + Nuovo Utente
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-500">Caricamento...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dipartimento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creato</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{u.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getRoleBadgeColor(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.department || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(u.createdAt).toLocaleDateString('it-IT')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setShowPasswordModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    🔑 Password
                                                </button>
                                                {u._id !== user._id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id, u.username)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        🗑️ Elimina
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        Totale utenti: {users.length}
                    </div>
                </div>
            </div>

            {/* Modal Nuovo Utente */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Crea Nuovo Utente</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password *</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ruolo *</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="team">Team</option>
                                    <option value="prod_manager">Responsabile Produzione</option>
                                    <option value="lab_manager">Responsabile Laboratorio</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Dipartimento</label>
                                <input
                                    type="text"
                                    value={newUser.department}
                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="es. Produzione A"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewUser({ username: '', password: '', role: 'team', department: '' });
                                    }}
                                    className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Crea Utente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Cambia Password */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Cambia Password</h2>
                        <p className="text-sm text-gray-600 mb-4">Utente: <span className="font-semibold">{selectedUser.username}</span></p>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nuova Password *</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Minimo 6 caratteri"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setSelectedUser(null);
                                        setNewPassword('');
                                    }}
                                    className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Aggiorna Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
