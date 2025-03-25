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
        <div>
            <h2>Login to CodeQnA</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                /><br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                /><br />

                <button type="submit">Login</button>
            </form>

            {error && <p style={{ color:'red'}}>{error}</p>}
        </div>
    );
}


export default Login;