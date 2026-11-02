import { render } from 'preact';
import './styles/tokens.css';
import './styles/app.css';
import { AdminApp } from './ui/AdminApp';

render(<AdminApp />, document.getElementById('app')!);
