import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, Banknote, Trophy, LandPlot, Settings, LogOut } from 'lucide-react';
import { useLeague } from '../../context/LeagueContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css'; // We will create this

const Sidebar = () => {
    const navItems = [
        { label: 'My Leagues', path: '/my-leagues', icon: Trophy }, // NEW
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }, // Updated path
        { label: 'Rosa (Roster)', path: '/roster', icon: Users },
        { label: 'Mercato', path: '/market', icon: ShoppingBag },
        { label: 'Finanze', path: '/finance', icon: Banknote },
        { label: 'Calendario', path: '/league', icon: Trophy }, // Calendario/League info
        { label: 'Stadio', path: '/stadium', icon: LandPlot },
    ];

    const { currentUser } = useLeague();
    const { user, logout } = useAuth();
    const isAdmin = currentUser.role === 'admin';

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>FantaManager</h1>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`
                        }
                        style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}
                    >
                        <Settings size={20} />
                        <span>Admin Console</span>
                    </NavLink>
                )}
            </nav>

            <div className={styles.footer} style={{ gap: '1rem', display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 }}>
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.username}</p>
                        <button
                            onClick={logout}
                            style={{
                                background: 'none', border: 'none', padding: 0,
                                color: 'var(--color-accent-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem'
                            }}
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
