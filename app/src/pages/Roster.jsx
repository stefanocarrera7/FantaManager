import RosterList from '../features/roster/RosterList';

const Roster = () => {
    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Team Roster</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>View your squad details</p>
                </div>
            </header>

            <RosterList />
        </div>
    );
};

export default Roster;
