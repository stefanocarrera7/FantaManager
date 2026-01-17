import { Navigate, Outlet } from 'react-router-dom';
import { useCompetition } from '../context/CompetitionContext';

const RequireCompetition = () => {
    const { activeCompetition } = useCompetition();

    if (!activeCompetition) {
        return <Navigate to="/my-leagues" replace />;
    }

    return <Outlet />;
};

export default RequireCompetition;
