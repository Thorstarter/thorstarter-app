export default function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay">
      <div className="w-full text-center">{message || "Loading..."}</div>
    </div>
  );
}
