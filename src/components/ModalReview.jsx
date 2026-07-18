import './ModalReview.css';

export default function ModalReview({ isOpen, onClose, children, onReviewAi, onSave, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Review trận đấu ( thống kê dựa trên các comment của khản giả )</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng modal">×</button>
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-ai" onClick={onReviewAi}>
            Review bằng AI
          </button>

          <div className="modal-actions-right">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onCancel || onClose}>
              Huỷ bỏ
            </button>
            <button type="button" className="modal-btn modal-btn-save" onClick={onSave}>
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}