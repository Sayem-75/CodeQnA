import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Channels() {
    const [channels, setChannels] = useState([]);
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    // Fetch all channels from backend
    useEffect(() => {
        fetch('http://localhost:3000/alldata')
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // setChannels(data.data);
                const uniqueChannels = [];
                const seen = new Set();

                data.data.forEach(row => {
                    if (!seen.has(row.channelId)) {
                        seen.add(row.channelId);
                        uniqueChannels.push({
                            channelId: row.channelId,
                            topic: row.topic,
                            channelContent: row.channelContent,
                            channelTime: row.channelTime
                        });
                    }
                });

                setChannels(uniqueChannels);

            }
        })
        .catch((err) => {
            console.error(err);
            setError('Could not load channels.');
        });
    }, []);

    // Handle new channel creation
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/createchannel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ topic, content }),
            });

            const data = await response.json();
            if (data.success) {
                // Re-fetch all data to show new channel
                const updated = await fetch('http://localhost:3000/alldata');
                const updatedData = await updated.json();
                setChannels(updatedData.data);

                setTopic('');
                setContent('');
            } else {
                setError(data.message || 'Channel creation failed');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong.');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>All Channels</h2>

            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    placeholder="Channel Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    style={styles.input}
                />
                <textarea
                    placeholder="Description / Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows="3"
                    style={styles.textarea}
                />
                <button type="submit" style={styles.button}>Create Channel</button>
                {error && <p style={styles.error}>{error}</p>}
            </form>

            <div style={styles.channelList}>
                {channels.length === 0 ? (
                    <p>No channels found.</p>
                ) : (
                    channels.map((channel, index) => (
                        <Link to={`/channel/${channel.channelId}`} style={styles.channelLink}>
                            <div key={index} style={styles.channelCard}>
                                <h3 style={styles.channelTitle}>{channel.topic}</h3>
                                <p style={styles.channelContent}>{channel.channelContent}</p>
                                <p style={styles.timestamp}>Created: {new Date(channel.channelTime).toLocaleString()}</p>
                            </div>
                        </Link>
                    ))
                )}
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
    heading: {
        fontSize: '32px',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '500px',
        gap: '10px',
        marginBottom: '30px',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        backgroundColor: '#111',
        color: '#fff',
        border: '1px solid #555',
        borderRadius: '4px',
    },
    textarea: {
        padding: '10px',
        fontSize:'16px',
        backgroundColor: '#111',
        color: '#fff',
        border: '1px solid #555',
        borderRadius: '4px',
        resize: 'vertical', 
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
        color: 'red',
        marginTop: '10px',
    },
    channelList: {
        marginTop: '20px',
    },
    channelCard: {
        backgroundColor: '#111',
        padding: '20px',
        marginBottom: '15px',
        borderRadius: '6px',
        border: '1px solid #32CD32',
    },
    channelTitle: {
        fontSize: '20px',
        marginBottom: '5px',
        color: '#32CD32',
    },
    channelContent: {
        fontSize: '16px',
        marginBottom: '8px',
    },
    timestamp: {
        fontSize: '12px',
        color: '#aaa',
    },
    channelLink: {
        textDecoration: 'none',
    }
};





export default Channels;