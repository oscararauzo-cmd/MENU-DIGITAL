import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {BarSessionScreen} from './components/BarSessionScreen';
import {readBarSession} from './utils/barSession';
const barSession=readBarSession(window.location.search,localStorage);

createRoot(document.getElementById('root')!).render(barSession?<BarSessionScreen session={barSession}/>:<App />);
