import { useState } from 'react';
import {
    useParams,
    useNavigate
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import VideoPlayer from '../components/VideoPlayer';
import LyricPanel from '../components/LyricPanel';
import ExplanationPanel from '../components/ExplanationPanel';
import { videoService } from '../services/api';
import '../styles/components/VideoWatch.css';

// Mock data tạm — sau thay bằng API
const MOCK_VIDEO = {
    title: 'D12SSINHNHẬT – Đại Vũ vs Azasty – Battle Rap',
    stats: '124k lượt xem • 2 năm trước',
    url: 'https://www.youtube.com/watch?v=oS6OT8ePzqw&list=RDoS6OT8ePzqw&start_radio=1',
    lyrics: [
        { id: 1, timestamp: 10, text: 'Mày nghĩ mày là ai khi đứng trước tao?' },
        { id: 2, timestamp: 13, text: 'Cái miệng mày chỉ toàn nói chuyện bao đồng' },
        { id: 3, timestamp: 16, text: 'Tao là Azasty, tên tao là cơn bão — mày chỉ là gió lạnh', explanation: { meaning: 'Azasty tự ví mình là "cơn bão" — mạnh mẽ, hủy diệt.', reference: 'Tên "Đại Vũ" có nghĩa là "mưa lớn"', refTag: 'Wordplay tên', whyGood: 'Double meaning vừa ẩn dụ thời tiết vừa đánh vào tên đối thủ' } },
        { id: 4, timestamp: 19, text: 'Đại Vũ đại bại, về mà ôm mẹ ngủ đi con' },
        { id: 5, timestamp: 22, text: 'Tao đã nói rồi, trận này tao chốt gọn' },
        { id: 6, timestamp: 25, text: 'Mày rap như đọc thơ lớp ba, nghe mà ngán' },
        { id: 7, timestamp: 28, text: 'Flow mày cứng đờ như khúc gỗ giữa sân' },
        { id: 8, timestamp: 31, text: 'Tao đứng đây nhìn mày run, thấy tội ghê' },
        { id: 9, timestamp: 34, text: 'Mười năm nữa mày cũng chưa chạm được tới tê' },
        { id: 10, timestamp: 37, text: 'Bar mày nhạt như nước lã, không có muối' },
        { id: 11, timestamp: 40, text: 'Khán giả ngồi đây ngáp dài vì mày thôi' },
        { id: 12, timestamp: 43, text: 'Tao từng nghe mày battle, tưởng nghe radio hỏng' },
        { id: 13, timestamp: 46, text: 'Giọng mày phát ra như tiếng còi xe ôm' },
        { id: 14, timestamp: 49, text: 'Mày chuẩn bị gì vậy? Tao chưa thấy gì cả' },
        { id: 15, timestamp: 52, text: 'Đứng trên sân này mà run như tàu lá' },
        { id: 16, timestamp: 55, text: 'Tao không cần diss nặng, mày tự thua rồi', explanation: { meaning: 'Tự tin tuyệt đối — không cần cố gắng cũng thắng', reference: 'Kỹ thuật "không thèm diss" — tự tin cao độ', refTag: 'Confidence bar', whyGood: 'Làm đối thủ mất tinh thần hoàn toàn' } },
        { id: 17, timestamp: 58, text: 'Nhìn vào mắt tao đi, mày thấy gì không?' },
        { id: 18, timestamp: 61, text: 'Thấy người đang đứng trên đỉnh nhìn xuống không?' },
        { id: 19, timestamp: 64, text: 'Mày leo mãi chưa tới lưng chừng núi tao' },
        { id: 20, timestamp: 67, text: 'Azasty sinh ra để thắng, đó là số trời' },
        { id: 21, timestamp: 70, text: 'Mày có bao nhiêu năm kinh nghiệm? Vứt đi' },
        { id: 22, timestamp: 73, text: 'Đứng cạnh tao một phút, mày học được gì' },
        { id: 23, timestamp: 76, text: 'Tao không dạy miễn phí, nhưng hôm nay ngoại lệ' },
        { id: 24, timestamp: 79, text: 'Bài học đầu tiên: đừng bước lên sân với kẻ trên tầm' },
        { id: 25, timestamp: 82, text: 'Mày mang gì đến đây? Một mớ vần điệu rẻ?' },
        { id: 26, timestamp: 85, text: 'Rhyme mày đoán được từ câu đầu tiên luôn' },
        { id: 27, timestamp: 88, text: 'Tao nghe qua một lần, quên ngay không tiếc' },
        { id: 28, timestamp: 91, text: 'Vì không có gì đáng để tao nhớ hết' },
        { id: 29, timestamp: 94, text: 'Đại Vũ ơi, mày có nghe tao không?' },
        { id: 30, timestamp: 97, text: 'Hay tai mày đang nghẽn vì tự ái quá' },
        { id: 31, timestamp: 100, text: 'Tao diss mày bằng sự thật, không cần bịa' },
        { id: 32, timestamp: 103, text: 'Sự thật đau hơn dao, mày biết không nà?' },
        { id: 33, timestamp: 106, text: 'Nhìn lại đi, mày đã làm được gì trong năm nay' },
        { id: 34, timestamp: 109, text: 'Một trận thắng? Hay chỉ toàn ngồi chờ may?' },
        { id: 35, timestamp: 112, text: 'Tao mỗi tuần một trận, trận nào cũng sáng' },
        { id: 36, timestamp: 115, text: 'Mày mỗi tháng một lần, lần nào cũng tắt' },
        { id: 37, timestamp: 118, text: 'Contrast rõ chưa? Cần tao vẽ biểu đồ không?', explanation: { meaning: 'So sánh trực tiếp tần suất hoạt động — Azasty liên tục, Đại Vũ thưa thớt', reference: 'Kỹ thuật contrast để làm nổi bật sự chênh lệch', refTag: 'Contrast bar', whyGood: 'Dùng logic và số liệu để diss — không cần chửi thề vẫn đau' } },
        { id: 38, timestamp: 121, text: 'Tao vẽ bằng bar, mày xem bằng hai mắt' },
        { id: 39, timestamp: 124, text: 'Khán giả đã chọn rồi, tao thấy trong ánh mắt' },
        { id: 40, timestamp: 127, text: 'Họ nhìn tao với ánh mắt của kẻ thắng' },
        { id: 41, timestamp: 130, text: 'Họ nhìn mày với ánh mắt thương hại thôi' },
        { id: 42, timestamp: 133, text: 'Đừng buồn Đại Vũ, thua tao không có gì xấu hổ' },
        { id: 43, timestamp: 136, text: 'Vì tao là đỉnh, mày chỉ là bước đệm thôi' },
        { id: 44, timestamp: 139, text: 'Cảm ơn mày đã đến, cho tao có đối thủ' },
        { id: 45, timestamp: 142, text: 'Dù đối thủ này hơi yếu, nhưng thôi kệ' },
        { id: 46, timestamp: 145, text: 'Tao cần mày để sáng hơn, như đèn cần bóng tối' },
        { id: 47, timestamp: 148, text: 'Không có mày, khán giả không thấy tao rõ đâu' },
        { id: 48, timestamp: 151, text: 'Trận này kết thúc rồi, nhưng tao muốn nói thêm' },
        { id: 49, timestamp: 154, text: 'Về nhà luyện thêm mười năm rồi quay lại nhé' },
        { id: 50, timestamp: 157, text: 'Azasty out — trận này tao chốt không cần vote', explanation: { meaning: 'Tự tuyên bố thắng trước khi vote — cực kỳ tự tin', reference: 'Kỹ thuật closing bar — kết thúc mạnh', refTag: 'Closing bar', whyGood: 'Câu kết để lại ấn tượng mạnh nhất trong trận' } },
    ],
};

export default function VideoWatch() {
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedLine, setSelectedLine] = useState(null);

    const { videoId } = useParams();
    const navigate = useNavigate();

    const handleTimeUpdate = (time) => {
        setCurrentTime(time);
    };

    const handleSelectLine = (line) => {
        setSelectedLine(line);
    };

    const {
        data: video,
        isLoading,
        error
    } = useQuery({

        queryKey: ['video', videoId],

        queryFn: async () => {
            try {

                const res =
                    await videoService.getById(videoId);

                return res.data;

            } catch (err) {

                console.log(
                    'API ERROR:',
                    err
                );

                throw err;
            }

        },

        // Dùng cache hoàn toàn trong 5 phút
        staleTime: 5 * 60 * 1000,

        // Giữ cache trong RAM 30 phút sau khi rời component
        gcTime: 30 * 60 * 1000

    });


    return (
        console.log('VideoWatch render with videoId:', video),
        <div className="watch-page">
            {/* 
            <button onClick={() => navigate(-1)}>
                ← Back
            </button> */}

            <div className="watch-main">

                <VideoPlayer
                    // videoId={videoId}
                    videoUrl={video?.linkVideo}
                    onTimeUpdate={handleTimeUpdate}
                />

                <LyricPanel
                    lyrics={MOCK_VIDEO.lyrics}
                    currentTime={currentTime}
                    selectedId={selectedLine?.id}
                    onSelectLine={handleSelectLine}
                />

            </div>

            <ExplanationPanel
                line={selectedLine}
                onClose={() => setSelectedLine(null)}
            />

        </div>
    );
}