import { Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Header() {
    const navigate = useNavigate();
    // const userId = localStorage.getItem('userId');
    const { user, setUser } = useAuth();

    const handleLogout = () => {
        setUser(null);
        navigate('/login');
    };

    return (
        <header style={styles.header}>
            <Link to="/" style={styles.title}>CodeQnA</Link>
    
            <nav>
                <ul style={styles.navList}>
                    <li><Link to ="/" style={styles.link}>Home</Link></li>
                    {!user && <li><Link to="/login" style={styles.link}>Login</Link></li>}
                    {!user && <li><Link to="/register" style={styles.link}>Register</Link></li>}
                    {user && <li><Link to="/channels" style={styles.link}>Channels</Link></li>}
                    {user?.role === 'admin' && <li><Link to="/users" style={styles.link}>Users</Link></li>}
                    {user && <li><button onClick={handleLogout} style={styles.logoutBtn}>Logout</button></li>}
                </ul>
            </nav>
        </header> 
    );
}

const styles = {
    header: {
      backgroundColor: '#000',
      padding: '15px 30px',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #32CD32'
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#32CD32',
      textDecoration: 'none',
      transition: 'color 0.2s',
    },
    navList: {
      listStyle: 'none',
      display: 'flex',
      gap: '20px',
      margin: 0,
      padding: 0,
    },
    link: {
      color: '#fff',
      textDecoration: 'none',
      fontSize: '16px',
      transition: 'color 0.2s',
    },
    logoutBtn: {
      backgroundColor: '#32CD32',
      color: '#000',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 16px',
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: '16px',
      verticalAlign: 'middle',
    }
  };



export default Header;

