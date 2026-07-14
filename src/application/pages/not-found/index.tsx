import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-themed-primary px-4 text-center text-themed-primary">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-themed-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-2 inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}
