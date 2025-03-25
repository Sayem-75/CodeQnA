import {useState} from 'react';
import { useNavigate } from 'react-router-dom' 

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate =  useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                credentials: 'include', // Include cookies for session
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('userId', data.id);
                navigate('/channels');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div>
            <h2>Register for CodeQnA</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                /><br />

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

                <button type="submit">Register</button>
            </form>

            {error && <p style={{ color:'red'}}>{error}</p>}
        </div>
    );
}



export default Register;