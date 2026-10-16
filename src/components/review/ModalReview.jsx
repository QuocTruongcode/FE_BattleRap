import './ModalReview.css';

export default function ModalReview({
  isOpen,
  onClose,
  children,
  onReviewAi,
  onSummarizeAi,
  onSave,
  onCancel,
  isAnalyzing,
  isSummarizing,
  progressMessage,
  title = 'Review trận đấu ( thống kê dựa trên các comment của khản giả )',
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng modal">×</button>
        </div>

        <div className="modal-body">{children}</div>

        {/* Khu vực hiện tiến trình khi đang phân tích AI */}
        {(isAnalyzing || isSummarizing) && (
          <div className="ai-progress">
            <span className="ai-spinner" />
            <span className="ai-progress-text">
              {isSummarizing ? progressMessage || "Đang tóm tắt bằng AI" : progressMessage || "Đang khởi tạo"}
              <span className="ai-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </span>
          </div>
        )}

        <div className="modal-actions">
          {onReviewAi && (
            <button type="button" className="modal-btn modal-btn-ai" onClick={onReviewAi} disabled={isAnalyzing}>
              {isAnalyzing ? "Đang xử lý..." : "Review bằng AI"}
            </button>
          )}
          {onSummarizeAi && (
            <button
              type="button"
              className="modal-btn modal-btn-ai"
              onClick={onSummarizeAi}
              disabled={isSummarizing || isAnalyzing}
            >
              {isSummarizing ? "Đang tóm tắt..." : "Tóm tắt bằng AI"}
            </button>
          )}

          <div className="modal-actions-right">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onCancel}>
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