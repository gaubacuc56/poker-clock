export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="card fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 py-2 text-sm font-medium shadow-xl md:bottom-6"
    >
      {message}
    </div>
  );
}
