import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

function ChannelView() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);
    const [error, setError] = useState('');
    const[newMessage, setNewMessage] = useState('');
    const [screenshotURL, setScreenshotURL] = useState('');
    const [replyContent, setReplyContent] = useState({});
    const [ratingData, setRatingData] = useState({});
    const { user } = useAuth();

    // Load channel data
    const fetchChannelData = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3000/alldata');
            const data  = await res.json();

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
                    timestamp: channelData[0].channelTime,
                    author: channelData[0].channelAuthor
                } : null);

                // Group messages, replies and organize nested replies, and ratings
                const grouped = {};
                const replyMap = {};
                const ratingsMap = {};

                channelData.forEach(row => {
                    if (row.messageId) {
                        if (!grouped[row.messageId]) {
                            grouped[row.messageId] = {
                                id: row.messageId,
                                content: row.messageContent,
                                timestamp: row.messageTime,
                                screenshot: row.messageScreenshot,
                                author: row.messageAuthor || "Anonymous",
                                replies: []
                            };
                        }
                    }

                    if (row.replyId) {
                        replyMap[row.replyId] = {
                            id: row.replyId,
                            content: row.replyContent,
                            timestamp: row.replyTime,
                            parentReplyId: row.parentReplyId || null,
                            messageId: row.replyMessageId,
                            screenshot: row.replyScreenshot,
                            author: row.replyAuthor || "Anonymous",
                            replies: []
                        };
                    }

                    if (row.ratingTarget === 'channel' && row.ratingChannelId) {
                        if (!ratingsMap[`channel-${row.ratingChannelId}`]) {
                            ratingsMap[`channel-${row.ratingChannelId}`] = { up: 0, down: 0};
                        }
                        if (row.isUpVote) ratingsMap[`channel-${row.ratingChannelId}`].up++;
                        else ratingsMap[`channel-${row.ratingChannelId}`].down++;
                    }

                    if (row.ratingTarget === 'message' && row.ratingMessageId) {
                        if (!ratingsMap[`message-${row.ratingMessageId}`]) {
                            ratingsMap[`message-${row.ratingMessageId}`] = { up: 0, down: 0};
                        }
                        if (row.isUpVote) ratingsMap[`message-${row.ratingMessageId}`].up++;
                        else ratingsMap[`message-${row.ratingMessageId}`].down++;
                    }

                    if (row.ratingTarget === 'reply' && row.ratingReplyId) {
                        if (!ratingsMap[`reply-${row.ratingReplyId}`]) {
                            ratingsMap[`reply-${row.ratingReplyId}`] = { up: 0, down: 0};
                        }
                        if (row.isUpVote) ratingsMap[`reply-${row.ratingReplyId}`].up++;
                        else ratingsMap[`reply-${row.ratingReplyId}`].down++;
                    }
                });

                // Nest replies properly
                Object.values(replyMap).forEach(reply => {
                    if (reply.parentReplyId) {
                        //Nested reply -> attach under its parent reply
                        const parent = replyMap[reply.parentReplyId];
                        if (parent) parent.replies.push(reply);
                    } else {
                        // Direct reply to a message
                        const message = grouped[reply.messageId];

                        // const message = grouped[Object.keys(grouped).find(id => reply.id && grouped[id].replies.some(r => r.id === reply.id))] ||
                        //                 grouped[channelData.find(row => row.replyId === reply.id)?.messageId];

                        if (message) message.replies.push(reply);
                    }
                });

                setMessages(Object.values(grouped));
                setRatingData(ratingsMap);
            }
        } catch(err) {
            console.error(err);
            setError('Could not load channel.');
        }
    }, [id]);

    useEffect(() => {
        fetchChannelData();
    }, [fetchChannelData]);

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('http://localhost:3000/postmessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ channelId: id, content: newMessage, screenshot: screenshotURL }),
            });

            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                setScreenshotURL('');
                // Re-fetch channel data to update messages
                fetchChannelData();
            }
        } catch (err) {
                console.error('Error posting message: ', err);
            }
    };

    const handlePostReply = async (messageId, parentReplyId = null) => {
        const key = parentReplyId ? `${messageId}-${parentReplyId}` : `${messageId}`;
        const content = replyContent[key] || '';
        if (!content.trim()) return;

        try {
            const response = await fetch('http://localhost:3000/postreply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    messageId: parentReplyId ? null : messageId,
                    parentReplyId: parentReplyId, 
                    content,
                    screenshot: screenshotURL 
                }),
            });

            const data = await response.json();
            if (data.success) {
                setReplyContent(prev => ({ 
                    ...prev, 
                    [key] : '' 
                }));
                setScreenshotURL('');
                
                // Re-fetch channel data to update replies
                fetchChannelData();
            }
        } catch (err) {
                console.error('Failed to post reply: ', err);
            }
    };

    const handleRate = async (target, id, isUpVote) => {
        try {
            const response = await fetch('http://localhost:3000/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    targetType: target,
                    targetId: id,
                    isUpVote
                })
            });

            const data = await response.json();
            if (data.success) {
                fetchChannelData();
            } else {
                alert(data.message || "Failed to rate.");
            }
        } catch (err) {
            console.error("Error rating item:", err);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await fetch(`http://localhost:3000/deletemessage/${messageId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                fetchChannelData();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Failed to delete message: ', err);
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (!window.confirm("Are you sure you want to delete this reply?")) return;
        try {
            const res = await fetch(`http://localhost:3000/deletereply/${replyId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                fetchChannelData();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Failed to delete reply: ', err);
        }
    };
    
    if (error) return <p>{error}</p>;
    if (!channel && !error) return <p>Loading channel details...</p>;

    const renderReplies = (replies, parentMessage) => {
        return replies.map(reply => (
            <div key={reply.id} style={styles.reply}>
                <p style={styles.author}><strong>{reply.author}</strong></p>
                <p>{reply.content}</p>

                {reply.screenshot && (
                    <img src={reply.screenshot} alt="screenshot" style={styles.screenshot} />
                )}

                <p style={styles.timestamp}>{new Date(reply.timestamp).toLocaleString()}</p>

                {renderRatings('reply', reply.id)}


                {user?.role === 'admin' && (
                    <button onClick={() => handleDeleteReply(reply.id)} style={styles.adminBtn}>Delete Reply</button>
                )}

                {/* Nested Reply Input */}
                <textarea
                    placeholder="Reply to this reply..."
                    value={replyContent[`${parentMessage.id}-${reply.id}`] || ''}
                    onChange={(e) => setReplyContent (prev => ({...prev, [`${parentMessage.id}-${reply.id}`]: e.target.value}))}
                    rows={2}
                    style={styles.textarea}
                />
                <button onClick={() => handlePostReply(parentMessage.id, reply.id)} style={styles.button}>Reply</button>

                {reply.replies.length > 0 && (
                    <div style={styles.replies}>
                        {renderReplies(reply.replies, reply)}
                    </div>
                )}
            </div>
        ));
    };

    const renderRatings = (target, id) => {
        const key = `${target}-${id}`;
        const rating = ratingData[key] || { up: 0, down: 0};

        return (
            <div>
                <button onClick={() => handleRate(target, id, true)} style={styles.ratingBtn}>👍 {rating.up}</button>
                <button onClick={() => handleRate(target, id, false)} style={styles.ratingBtn}>👎 {rating.down}</button>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <p style={styles.author}><strong>{channel.author}</strong></p>
            <h2 style={styles.heading}>{channel.topic}</h2>
            <p>{channel.content}</p>
            <p style={styles.timestamp}>Created: {new Date(channel.timestamp).toLocaleDateString()}</p>
            {renderRatings('channel', channel.id)}

            <form onSubmit={handlePostMessage} style={styles.form}>
                <textarea
                    placeholder="Write a new message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={styles.textarea}
                    rows={3}
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
                <button type="submit" style={styles.button}>Post Message</button>
            </form> 

            <h3>Messages</h3>
            {messages.map(msg => (
                <div key={msg.id} style={styles.card}>
                    <p style={styles.author}><strong>{msg.author}</strong></p>
                    <p style={styles.message}>{msg.content}</p>

                    {msg.screenshot && (
                        <img src={msg.screenshot} alt="screenshot" style={styles.screenshot} />
                    )}

                    <p style={styles.timestamp}>Posted: {new Date(msg.timestamp).toLocaleString()}</p>

                    {renderRatings('message', msg.id)}


                    {user?.role === 'admin' && (
                    <button onClick={() => handleDeleteMessage(msg.id)} style={styles.adminBtn}>Delete Message</button>
                    )}

                    {msg.replies.length > 0 && (
                        <div style={styles.replies}>
                            <strong>Replies:</strong>
                            {renderReplies(msg.replies, msg)}
                        </div>
                    )}

                    <div style={styles.replyContainer}>
                        <textarea
                            placeholder="Type your reply here..."
                            value={replyContent[msg.id] || ''}
                            onChange={(e) => setReplyContent(prev => ({ ...prev, [msg.id]: e.target.value }))}
                            rows={3}
                            style={styles.textarea}
                        /> <br/>
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
                        <button onClick={() => handlePostReply(msg.id)} style = {styles.button}>Reply</button>
                    </div>
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
    input: {
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
        marginLeft: '20px',
        paddingLeft: '10px',
        borderLeft: '1px dashed #32CD32',
    },
    timestamp: {
        fontSize: '12px',
        color: '#aaa',
    },
    message: {
        fontSize: '18px',
        fontWeight: 'bold',
    },
    replyContainer: {
        marginTop: '20px'
    },
    screenshot: {
        maxWidth: '75%',
        marginTop: '10px',
        border: '1px solid #32CD32',
        borderRadius: '4px',
    },
    author: {
        fontSize: '16px',
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
    ratingBtn: {
        backgroundColor:'#111',
        color: '#fff',
        border: '1px solid #32CD32',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginRight: '10px',
        transition: 'background-color 0.2s, transform 0.2s',
    },
    ratingBtnHover: {
        backgroundColor: '#222',
        transform: 'scale(1.05)',
    },
};



export default ChannelView;
