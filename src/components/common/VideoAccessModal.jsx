import { FaImage } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './VideoAccessModal.css';

const formatScore = (score) => {
    if (score === null || score === undefined || score === '') return '—';

    const numericScore = Number(score);
    return Number.isFinite(numericScore) ? numericScore.toLocaleString('vi-VN') : '—';
};

export default function VideoAccessModal({ video, onClose }) {
    const { user } = useAuth();
    const userName = user?.UserName || 'Người dùng';
    const userScore = user?.score ?? user?.Score ?? user?.totalScore ?? user?.TotalScore;
    const cleanScore = video?.cleanScore;
    const thumbnailUrl = video?.thumbnailUrl;

    return (
        <div className="video-access-modal__backdrop">
            <section
                className="video-access-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="video-access-modal-title"
            >
                {onClose && (
                    <button
                        type="button"
                        className="video-access-modal__close"
                        onClick={onClose}
                        aria-label="Đóng thông báo"
                    >
                        ×
                    </button>
                )}

                <div className="video-access-modal__image">
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={video?.title || 'Ảnh trận đấu'} />
                    ) : (
                        <FaImage aria-hidden="true" />
                    )}
                </div>

                <div className="video-access-modal__content">
                    <p className="video-access-modal__eyebrow">Nội dung giới hạn</p>
                    <h2 id="video-access-modal-title">Chưa thể xem trận đấu này</h2>
                    <p className="video-access-modal__message">
                        Tài khoản <strong>{userName}</strong> có <strong>{formatScore(userScore)} điểm</strong>
                        {' '}và trận đấu có <strong> cần ít nhất {formatScore(cleanScore)} điểm</strong>,
                        {' '}chưa đủ điều kiện để xem trận đấu này.
                    </p>
                    <p className="video-access-modal__description">
                        Tôi cần xác minh bạn đã đủ sẵn sàng để xem các trận đấu nặng đô hơn hay không.
                        {' '}<a href='https://docs.google.com/forms/d/e/1FAIpQLScomrw39QQ1uS5k3TlQyOCYJfHVhPA-hBNG36UVv043T-t-Gw/viewform?usp=header'><i>Tham gia làm bài kiểm tra tại đây</i></a>.
                    </p>
                    <p className="video-access-modal__note">
                        <i>*Lưu ý: Form chỉ được làm một lần; sau 2 tuần mới có bài kiểm tra mới. khi làm xong vui lòng reload lại trang</i>
                    </p>
                </div>
            </section>
        </div>
    );
}
