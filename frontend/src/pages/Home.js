import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Home() {
    const { user } = useAuth();

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Welcome to CodeQnA</h1>
            <p style={styles.subheading}>
                A place to ask, answer, and grow your coding skills.
            </p>

            {!user ? (
                <div style={styles.buttonGroup}>
                    <Link to="/login" style={styles.button}>Login</Link>
                    <Link to="/register" style={styles.button}>Register</Link>
                </div>
            ) : (
                <div>
                    <Link to="/channels" style={styles.button}>Go to Channels</Link>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
      textAlign: 'center',
      padding: '80px 20px',
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh'
    },
    heading: {
      fontSize: '36px',
      marginBottom: '10px',
      color: '#fff'
    },
    subheading: {
      fontSize: '18px',
      color: '#ccc',
      marginBottom: '30px',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
    },
    button: {
      backgroundColor: '#32CD32',
      color: '#000',
      padding: '10px 20px',
      textDecoration: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  };
  




export default Home;