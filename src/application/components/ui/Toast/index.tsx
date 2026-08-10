export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div role="status" className="toast">
      {message}
    </div>
  );
}
