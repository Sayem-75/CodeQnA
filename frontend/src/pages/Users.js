import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function Users() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/users', {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            } else {
                setError(data.message || "Failed to fetch users.");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`http://localhost:3000/deleteuser/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                fetchUsers(); // Refresh the list
            } else {
                alert(data.message || "Failed to delete user.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    if (user?.role !== 'admin') {
        return <p style={styles.message}>Access denied. Admins only.</p>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Manage Users</h2>
            {error && <p style={styles.error}>{error}</p>}

            {users.map(u => (
                <div key={u.id} style={styles.card}>
                    <p><strong>Name:</strong> {u.name}</p>
                    <p><strong>Email:</strong> {u.email}</p>
                    <p><strong>Role:</strong> {u.role}</p>
                    <button onClick={() => handleDelete(u.id)} style={styles.adminBtn}>Delete User</button>
                </div>
            ))}
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: '#000',
        color: '#fff',
        minHeight: '100vh',
        padding: '40px',
    },
    heading: {
        fontSize: '28px',
        color: '#32CD32',
        marginBottom: '20px',
    },
    card: {
        backgroundColor: '#111',
        padding: '20px',
        marginTop: '15px',
        borderRadius: '6px',
        border: '1px solid #32CD32',
    },
    adminBtn: {
        backgroundColor: 'red',
        color: '#fff',
        border: 'none',
        padding: '6px 10px',
        marginTop: '10px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        marginTop: '15px',
        color: 'red',
    },
    message: {
        fontSize: '18px',
        color: 'red',
        textAlign: 'center',
        marginTop: '100px',
    },
}


export default Users;
