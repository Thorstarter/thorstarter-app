export default function Modal({ onClose, children, style = {} }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" style={style} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}