import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';


function ChannelView() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);
    const [error, setError] = useState('');

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
    
    if (error) return <p>{error}</p>;
    if (!channel) return <p>Loading Channel...</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>{channel.topic}</h2>
            <p>{channel.content}</p>
            <p style={styles.timestamp}>Created: {new Date(channel.timestamp).toLocaleDateString()}</p>

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