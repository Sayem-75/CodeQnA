import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Channels() {
    const [channels, setChannels] = useState([]);
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [screenshotURL, setScreenshotURL] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchChannels = async () => {
        try {
            const res = await fetch('http://localhost:3000/alldata');
            const data = await res.json();

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
                            channelScreenshot: row.channelScreenshot,
                            channelTime: row.channelTime,
                            channelAuthor: row.channelAuthor || "Anonymous"
                        });
                    }
                });

                setChannels(uniqueChannels);
            } else {
                setError('Could not fetch channels. ');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong.');
        }
    };

    // Fetch all channels from backend
    useEffect(() => {
        fetchChannels();
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
                body: JSON.stringify({ topic, content, screenshot: screenshotURL }),
            });

            const data = await response.json();
            if (data.success) {
                // Re-fetch all data to show new channel
                fetchChannels();

                setTopic('');
                setContent('');
                setScreenshotURL('');
            } else {
                setError(data.message || 'Channel creation failed');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong.');
        }
    };

    const handleDeleteChannel = async (channelId) => {
        if (!window.confirm("Are you sure you want to delete this channel?")) return;
        try {
            const res = await fetch(`http://localhost:3000/deletechannel/${channelId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                fetchChannels();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Failed to delete channel: ', err);
        }
    };

    if (error) return <p>{error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Browse Channels</h2>

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
                <input
                    type="text"
                    placeholder="Screenshot URL (optional)"
                    value={screenshotURL}
                    onChange={(e) => setScreenshotURL(e.target.value)}
                    style={styles.input}
                />
                <p style={{fontSize: '14px', color: '#ff0000' }}>
                    Upload your screenshot to an image hosting website like imgur.com, and use a direct image URL (ends in .png, .jpg, etc) from it.
                </p>
                <button type="submit" style={styles.button}>Create Channel</button>
                {error && <p style={styles.error}>{error}</p>}
            </form>

            <div style={styles.channelList}>
                {channels.length === 0 ? (
                    <p>No channels found.</p>
                ) : (
                    channels.map((channel, index) => (
                        <div key={channel.channelId} style={styles.channelCard}>
                            <p style={styles.author}><strong>{channel.channelAuthor}</strong></p>

                            <Link to={`/channel/${channel.channelId}`} style={styles.channelLink}>
                                <h3 style={styles.channelTitle}>{channel.topic}</h3>
                            </Link>

                            {channel.channelScreenshot && (
                                <img src={channel.channelScreenshot} alt="screenshot" style={styles.screenshot} />
                            )}

                            <p style={styles.channelContent}>{channel.channelContent}</p>
                            <p style={styles.timestamp}>Created: {new Date(channel.channelTime).toLocaleString()}</p>

                            {user?.role === 'admin' && (
                                <button onClick={() => handleDeleteChannel(channel.channelId)} style={styles.adminBtn}>Delete Channel</button>
                            )}
                        </div>
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
        color: "#fff",
    },
    timestamp: {
        fontSize: '12px',
        color: '#aaa',
    },
    channelLink: {
        textDecoration: 'none',
    },
    screenshot: {
        maxWidth: '75%',
        marginTop: '10px',
        border: '1px solid #32CD32',
        borderRadius: '4px',
    },
    author: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#00FA9A',
        marginBottom: '5px',
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
};





export default Channels;
