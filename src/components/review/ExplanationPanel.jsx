import { useEffect, useRef, useState } from 'react';
import { barService, explanation } from '../../services/api';
import './ExplanationPanel.css';
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    tablePlugin,
    linkPlugin,
    codeBlockPlugin,
} from '@mdxeditor/editor';
import { useAuth } from '../../contexts/AuthContext';

export default function ExplanationPanel({ line, onClose }) {
    const [panelWidth, setPanelWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(380);
    const [barContext, setBarContext] = useState({
        id: null,
        error: null,
    });
    const [LLMReply, setLLMReply] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [idExp, setIdExp] = useState(null);
    const { user } = useAuth();
    const canEdit = user?.UserType === "U0";
    useEffect(() => {
        let isActive = true;

        if (!line?.id) {
            return () => {
                isActive = false;
            };
        }

        setLLMReply(null);
        setBarContext({ id: null, error: null });

        const loadExplanation = async () => {
            try {
                // Each await completes before the next API call starts.
                const explanationResponse = await explanation.getExplanationByBarId(line.id);
                const exp = explanationResponse?.data;
                console.log("Check exp: ", exp);
                if (exp && exp.length > 0) {
                    if (isActive) {
                        setBarContext({ id: exp[0].barId, error: null });
                        setLLMReply(exp[0].meaning);
                        setIsExpanded(true);
                        setIdExp(exp[0].id);
                    }
                    return;
                }
                setIdExp(null);

            } catch (requestError) {
                if (isActive) {
                    setBarContext({
                        id: line.id,
                        markdown: null,
                        error: requestError.message || 'Không thể tải giải thích cho câu này.',
                    });
                }
            }
        };

        loadExplanation();

        return () => {
            isActive = false;
        };

    }, [line?.id]);

    // hàm lấy context và gửi lên LLM để phân tích
    const fetchAndExplainBar = async (line, isActive) => {
        try {
            const result = await barService.explainBar(line.id);
            if (!isActive) {
                return;
            }

            const data = result?.data ?? result;
            const content = data?.content ?? '';
            const rapName = data?.RapName ?? '';
            const FullName = data?.FullName ?? '';
            const title = data?.title ?? '';
            const linkVideo = data?.linkVideo ?? '';
            const review = data?.review ?? '';
            const describe = data?.Describe ?? '';

            const userMessage = `
-Câu rap: ${content}
-Người rap: ${rapName} (tên thật: ${FullName})
-Trận đấu: ${title}
-Link video: ${linkVideo}
-Đánh giá của khán giả: ${review}
-Thông tin về battler ${rapName}: ${describe}
`.trim();

            setBarContext({
                id: line.id,
                error: null,
            });

            // This request starts only after getExplanationByBarId and explainBar finish.
            const llmResponse = await explanation.callLLMAnalysisBar({ message: userMessage });
            // console.log("Check LLM response searchResults: ", llmResponse.message.searchResults);
            const internetContext = llmResponse.message.searchResults;

            const combinedAnswerMarkdown = internetContext
                .map((item, index) => {
                    const answer = item?.data?.answer;
                    if (!answer) return null; // bỏ qua item không có answer

                    // Nếu bạn có thêm nguồn/tiêu đề thì thêm vào đây, ví dụ item?.data?.url hoặc item?.data?.title
                    // const source = item?.sources?.url ? `\n> Nguồn: ${item.sources.url}` : "";

                    return `### Kết quả ${index + 1}\n${answer}`;
                })
                .filter(Boolean) // loại bỏ các phần tử null
                .join("\n\n---\n\n");

            console.log("Check combinedAnswerMarkdown: ", combinedAnswerMarkdown);
            if (isActive) {
                setLLMReply(llmResponse?.message.explanation);
                setIsExpanded(false);
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi lấy giải thích từ LLM: ' + error.message);
        }

    };

    useEffect(() => {
        if (!isResizing) {
            return undefined;
        }

        const handlePointerMove = (event) => {
            const nextWidth = resizeStartWidth.current + (resizeStartX.current - event.clientX);
            const maxWidth = Math.min(720, window.innerWidth * 0.7);
            setPanelWidth(Math.max(320, Math.min(maxWidth, nextWidth)));
        };

        const handlePointerUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isResizing]);

    const handleResizeStart = (event) => {
        resizeStartX.current = event.clientX;
        resizeStartWidth.current = panelWidth;
        setIsResizing(true);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isLoading = Boolean(line?.id) && barContext.id !== line.id;
    const error = barContext.id === line?.id ? barContext.error : null;
    // console.log("is loading: ", isLoading)
    const handleSubmitExp = async () => {
        try {
            const payload = {
                barId: line.id,
                meaning: LLMReply,
            };
            if (idExp) {
                await explanation.update(idExp, payload);
                alert("Cập nhật exp thành công")

            }
            else {
                await explanation.create(payload);
                alert("Thêm exp thành công")

            }
            setIsExpanded(true);
        } catch (e) {
            alert("Có lỗi xảy ra khi thêm giải thích")
        }

    }
    return (
        // console.log("Check user: ", user),
        // console.log("check id Exp: ", idExp),
        <div
            className={`explanation-panel ${!line ? 'hidden' : ''} ${isResizing ? 'is-resizing' : ''}`}
            style={{ '--explanation-panel-width': `${panelWidth}px` }}
        >
            {line && (
                <>
                    <div
                        className="panel-resize-handle"
                        onPointerDown={handleResizeStart}
                        role="separator"
                        aria-label="Điều chỉnh chiều rộng bảng giải thích"
                        aria-orientation="vertical"
                        tabIndex={0}
                    />
                    <div className="panel-header">
                        <h3>Giải thích punchline</h3>
                        <span className="panel-timestamp">{formatTime(line.time)}</span>
                        <button className="panel-close" onClick={onClose}>×</button>
                    </div>
                    <div className="panel-body">
                        <div className="quote-box">{line.content}</div>

                        {isLoading ? (
                            <div className="panel-section">
                                <p style={{ color: '#aaa' }}>Chưa có giải thích...</p>
                            </div>
                        ) : error ? (
                            <div className="panel-section">
                                <p style={{ color: '#f88' }}>{error}</p>
                            </div>
                        ) : LLMReply ? (
                            <div className="panel-section">
                                <MDXEditor
                                    key={isExpanded}
                                    markdown={LLMReply}
                                    readOnly={!canEdit}
                                    onChange={canEdit ? (newMarkdown) => setLLMReply(newMarkdown) : undefined}
                                    plugins={[
                                        headingsPlugin(),
                                        listsPlugin(),
                                        quotePlugin(),
                                        thematicBreakPlugin(),
                                        tablePlugin(),
                                        linkPlugin(),
                                        codeBlockPlugin(),
                                    ]}
                                />
                            </div>
                        ) : (
                            <div className="panel-section">
                                <p style={{ color: '#aaa' }}>Chưa có giải thích cho câu này.</p>
                            </div>
                        )}


                    </div>
                </>
            )}
            {canEdit ? (
                <div className="explanation-feedback">
                    <p>Bạn đánh giá như nào về câu trả lời này?</p>
                    <div className="explanation-feedback-actions">
                        <button type="button" className="agree-button" onClick={() => handleSubmitExp()}>
                            Đồng ý
                        </button>
                        <button type="button" className="feedback-button" onClick={() => fetchAndExplainBar(line, true)}>
                            Cần hỏi thêm
                        </button>
                    </div>
                </div>
            ) : (
                <div className="explanation-feedback">
                    <p>Sử dụng AI để giải thích bar!</p>
                    <div className="explanation-feedback-actions">
                        <button type="button" className="feedback-button" onClick={() => fetchAndExplainBar(line, true)}>
                            Chatbot
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}