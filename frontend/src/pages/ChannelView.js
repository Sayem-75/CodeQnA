import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ChannelView() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);
    const [error, setError] = useState('');
    const[newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/alldata')
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                const channelData = data.data.filter(row => row.channelId === Number(id));
                if (channelData.length === 0) {
                    setError("Channel not found.");
                    return;
                }

                setChannel(channelData.length > 0 ? {
                    id: channelData[0].channelId,
                    topic: channelData[0].topic,
                    content: channelData[0].channelContent,
                    timestamp: channelData[0].channelTime
                } : null);

                // Group messages and replies
                const grouped = {};
                channelData.forEach(row => {
                    if (!row.messageId) return;
                    if (!grouped[row.messageId]) {
                        grouped[row.messageId] = {
                            id: row.messageId,
                            content: row.messageContent,
                            timestamp: row.messageTime,
                            replies: []
                        };
                    }
                    if (row.replyId) {
                        grouped[row.messageId].replies.push({
                            id: row.replyId,
                            content: row.replyContent,
                            timestamp: row.replyTime
                        });
                    }
                });

                setMessages(Object.values(grouped));
            }
        })
        .catch((err) => {
            console.error(err);
            setError('Could not load channel.');
        });
    }, [id]);

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch('http://localhost:3000/postmessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ channelId: id, content: newMessage }),
            });

            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                // Re-fetch channel data to update messages
                const refresh = await fetch('http://localhost:3000/alldata');
                const freshData = await refresh.json();
                const channelData = freshData.data.filter(row => row.channelId === Number(id));

                const grouped = {};
                channelData.forEach(row => {
                    if (!row.messageId) return;
                    if (!grouped[row.messageId]) {
                        grouped[row.messageId] = {
                            id: row.messageId,
                            content: row.messageContent,
                            timestamp: row.messageTime,
                            replies: []
                        };
                    }
                    if (row.replyId) {
                        grouped[row.messageId].replies.push({
                            id: row.replyId,
                            content: row.replyContent,
                            timestamp: row.replyTime
                        });
                    }
                });

                setMessages(Object.values(grouped));
            }
        } catch (err) {
                console.error('Error posting message: ', err);
            }
    };
    
    if (error) return <p>{error}</p>;
    if (!channel) return <p>Loading Channel...</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>{channel.topic}</h2>
            <p>{channel.content}</p>
            <p style={styles.timestamp}>Created: {new Date(channel.timestamp).toLocaleDateString()}</p>

            <form onSubmit={handlePostMessage} style={styles.form}>
                <textarea
                    placeholder="Write a new message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={styles.textarea}
                    rows={3}
                />
                <button type="submit" style={styles.button}>Post Message</button>
            </form> 

            <h3>Messages</h3>
            {messages.map(msg => (
                <div key={msg.id} style={styles.card}>
                    <p style={styles.message}>{msg.content}</p>
                    <p style={styles.timestamp}>Posted: {new Date(msg.timestamp).toLocaleString()}</p>

                    {msg.replies.length > 0 && (
                        <div style={styles.replies}>
                            <strong>Replies:</strong>
                            {msg.replies.map(reply => (
                                <div key={reply.id} style={styles.reply}>
                                    <p>{reply.content}</p>
                                    <p style={styles.timestamp}>{new Date(reply.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
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
        fontSize: '32px',
        color: '#32CD32',
    },
    form: {
        display:'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom:'30px',
    },
    textarea: {
        backgroundColor: '#111',
        color: '#fff',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #555',
    },
    button: {
        backgroundColor: '#32CD32',
        color: '#000',
        fontWeight: 'bold',
        border: 'none',
        padding: '10px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    card: {
        backgroundColor: '#111',
        padding: '20px',
        marginTop: '15px',
        borderRadius: '6px',
        border: '1px solid #32CD32',
    },
    replies: {
        marginTop: '10px',
        paddingLeft: '15px',
        borderLeft: '2px solid #32CD32',
    },
    reply: {
        marginBottom: '10px',
    },
    timestamp: {
        fontSize: '12px',
        color: '#aaa',
    }
};


export default ChannelView;