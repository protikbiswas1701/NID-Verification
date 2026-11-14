import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-5xl font-extrabold text-navy-800">404</p>
        <h1 className="mt-3 text-xl font-bold">This page does not exist</h1>
        <p className="mt-1.5 text-sm text-slate-500">The link may be broken or the page may have moved.</p>
        <Link to="/" className="mt-6 inline-block"><Button>Go to home</Button></Link>
      </div>
    </div>
  );
}
