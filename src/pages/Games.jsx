import AppLayout from '../layouts/Apps';
import { memo } from 'react';

const Games = memo(() => <AppLayout type="games" />);

Games.displayName = 'Games';
export default Games;