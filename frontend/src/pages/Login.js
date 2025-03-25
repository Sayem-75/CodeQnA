import {useState} from 'react';
import { useNavigate } from 'react-router-dom'

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate =  useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                credentials: 'include', // Include cookies for session
                body: JSON.stringify({ email: email.trim(), password })
            });

            const data = await response.json();

            if (data.success) {
                // Store user info locally (basic)
                localStorage.setItem('userId', data.id);

                // Optional: store role if returned
                // localStorage.setItem('role', data.role);
                
                navigate('/channels');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Login to CodeQnA</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                <button type="submit" style={styles.button}>Login</button>
            </form>

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: '#000',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: '',
        padding: '200px',
    },
    heading: {
        fontSize: '32px',
        marginBottom: '20px',
    },
    form: {
        display:'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '400px',
        gap: '15px',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #555',
        backgroundColor: '#111',
        color: '#fff',
    },
    button: {
        backgroundColor: '#32CD32',
        color: '#000',
        fontWeight: 'bold',
        padding: '10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        marginTop: '15px',
        color: 'red',
    },
}





export default Login;