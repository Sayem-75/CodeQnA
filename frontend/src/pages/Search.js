import { useState } from 'react';
import { Link } from 'react-router-dom';

function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ channels: [], messages: [], replies: [] });
    const [error, setError] = useState('');

    const handleSearch = async () => {
        setError('');
        if (!query.trim()) return;

        try {
            const res = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query.trim())}`);
            const data = await res.json();

            if (data.success) {
                setResults(data.results);
            } else {
                setError(data.message || 'No results found.');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <h2>Search CodeQnA</h2>
            <input
                type="text"
                value={query}
                placeholder="Search for a topic, message, or reply..."
                onChange={(e) => setQuery(e.target.value)}
                style={styles.input}
            />
            <button onClick={handleSearch} style={styles.button}>Search</button>

            {error && <p style={styles.error}>{error}</p>}

            <div>
                <h3>Channels</h3>
                {results.channels.map((c, i) => (
                    <div key={i} style={styles.resultCard}>
                        <p><strong>Topic:</strong> {c.topic}</p>
                        <p>{c.content}</p>
                        <p><em>By {c.author}</em></p>
                        <Link to={`/channel/${c.channelId}`} style={styles.link}>View Channel</Link>
                    </div>
                ))}

                <h3>Messages</h3>
                {results.messages.map((m, i) => (
                    <div key={i} style={styles.resultCard}>
                        <p>{m.content}</p>
                        <p><em>By {m.author}</em></p>
                        <Link to={`/channel/${m.channelId}`} style={styles.link}>View Channel</Link>
                    </div>
                ))}

                <h3>Replies</h3>
                {results.replies.map((r, i) => (
                    <div key={i} style={styles.resultCard}>
                        <p>{r.content}</p>
                        <p><em>By {r.author}</em></p>
                        <Link to={`/channel/${r.channelId}`} style={styles.link}>View Channel</Link>
                    </div>
                ))}
            </div>
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
    input: {
        backgroundColor: '#111',
        color: '#fff',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #555',
        width: '300px',
        marginRight: '10px',
    },
    button: {
        backgroundColor: '#32CD32',
        color: '#000',
        fontWeight: 'bold',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginTop: '10px',
    },
    resultCard: {
        backgroundColor: '#111',
        padding: '15px',
        marginBottom: '10px',
        border: '1px solid #32CD32',
        borderRadius: '6px',
    },
    link: {
        color: '#32CD32',
        textDecoration: 'underline',
        marginTop: '10px',
        display: 'inline-block',
    },    
}





export default Search;
