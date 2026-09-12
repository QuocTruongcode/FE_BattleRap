import { useEffect, useRef, useState } from 'react';
import {
    FiArrowUp,
    FiChevronDown,
    FiCopy,
    FiEdit3,
    FiFileText,
    FiGlobe,
    FiMenu,
    FiMessageSquare,
    FiMoreHorizontal,
    FiPaperclip,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiSend,
    FiSettings,
    FiSidebar,
    FiSmile,
    FiUser,
    FiX,
} from 'react-icons/fi';
import './RAGChatBot.css';
import { chatBotService } from '../../services/api';
const starterMessages = [
    {
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Tôi có thể giúp bạn tìm kiếm và phân tích nội dung trong kho dữ liệu Battle Rap.',
    },
];

const conversations = [
    { id: 1, title: 'Phân tích trận B Ray vs Datmaniac', time: 'Hôm nay' },
    { id: 2, title: 'Tìm các bar có punchline mạnh', time: 'Hôm qua' },
    { id: 3, title: 'Tổng hợp phong cách Andree', time: 'Thứ 6' },
];

const quickPrompts = [
    { icon: FiSearch, label: 'Tìm kiếm bar nổi bật' },
    { icon: FiFileText, label: 'Tóm tắt một trận đấu' },
    { icon: FiSmile, label: 'Giải thích punchline' },
];

function formatMessage(text) {
    return text.split('\n').map((line, index) => (
        <span key={`${line}-${index}`}>
            {line}
            {index < text.split('\n').length - 1 && <br />}
        </span>
    ));
}

export default function RAGChatBot({ onSendMessage }) {
    const [messages, setMessages] = useState(starterMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const replyTimerRef = useRef(null);

    useEffect(() => () => clearTimeout(replyTimerRef.current), []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const resizeTextarea = (element) => {
        element.style.height = 'auto';
        element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
        resizeTextarea(event.target);
    };

    const handleNewChat = () => {
        clearTimeout(replyTimerRef.current);
        setMessages([]);
        setInput('');
        setIsTyping(false);
        textareaRef.current?.focus();
    };

    // const handleSend = async () => {
    //     const content = input.trim();
    //     if (!content || isTyping) return;

    //     setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content }]);
    //     setInput('');
    //     if (textareaRef.current) textareaRef.current.style.height = 'auto';
    //     setIsTyping(true);

    //     if (onSendMessage) {
    //         try {
    //             const response = await chatBotService(content);
    //             console.log('RAG response:', response);
    //             // if (response) {
    //             //     setMessages((current) => [...current, {
    //             //         id: `assistant-${Date.now()}`,
    //             //         role: 'assistant',
    //             //         content: typeof response === 'string' ? response : response.content,
    //             //     }]);
    //             // }
    //         } finally {
    //             setIsTyping(false);
    //         }
    //         return;
    //     }

    //     // replyTimerRef.current = setTimeout(() => {
    //     //     setMessages((current) => [...current, {
    //     //         id: `assistant-${Date.now()}`,
    //     //         role: 'assistant',
    //     //         content: 'Tôi đã nhận câu hỏi. Hãy kết nối prop `onSendMessage` với API RAG để hiển thị câu trả lời từ dữ liệu thực tế.',
    //     //     }]);
    //     //     setIsTyping(false);
    //     // }, 650);
    // };

    const handleSend = async () => {
        const content = input.trim();
        if (!content || isTyping) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content,
        };

        setMessages((current) => [...current, userMessage]);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setIsTyping(true);

        try {
            const response = await chatBotService.postQuery(content);
            const reply = response?.data?.message ?? 'Tôi chưa có câu trả lời cho câu hỏi này.';

            setMessages((current) => [
                ...current,
                {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: reply,
                },
            ]);
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi khi gửi tin nhắn.';

            setMessages((current) => [
                ...current,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: 'assistant',
                    content: errorMessage,
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const usePrompt = (prompt) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    return (
        <section className="rag-chatbot" aria-label="RAG ChatBot">
            <aside className={`rag-chatbot__sidebar${isSidebarOpen ? '' : ' is-collapsed'}`}>
                <div className="rag-chatbot__brand">
                    <div className="rag-chatbot__brand-mark"><FiMessageSquare /></div>
                    <span>RapMind</span>
                    <button className="rag-chatbot__icon-button rag-chatbot__sidebar-toggle" onClick={() => setIsSidebarOpen(false)} title="Thu gọn thanh bên" aria-label="Thu gọn thanh bên">
                        <FiSidebar />
                    </button>
                </div>

                <button className="rag-chatbot__new-chat" onClick={handleNewChat}>
                    <FiPlus />
                    <span>Cuộc trò chuyện mới</span>
                </button>

                <div className="rag-chatbot__history">
                    <span className="rag-chatbot__section-label">Gần đây</span>
                    {conversations.map((conversation) => (
                        <button className="rag-chatbot__history-item" key={conversation.id} title={conversation.title}>
                            <FiMessageSquare />
                            <span>{conversation.title}</span>
                            <small>{conversation.time}</small>
                        </button>
                    ))}
                </div>

                <div className="rag-chatbot__sidebar-footer">
                    <button className="rag-chatbot__footer-link"><FiSettings /> Cài đặt</button>
                    <div className="rag-chatbot__profile"><span className="rag-chatbot__avatar">N</span><span>Người dùng</span><FiMoreHorizontal /></div>
                </div>
            </aside>

            <main className="rag-chatbot__main">
                <header className="rag-chatbot__header">
                    <button className="rag-chatbot__icon-button" onClick={() => setIsSidebarOpen((open) => !open)} title="Hiện thanh bên" aria-label="Hiện thanh bên">
                        {isSidebarOpen ? <FiMenu /> : <FiSidebar />}
                    </button>
                    <div className="rag-chatbot__model-selector">
                        <span>RapMind</span>
                        <span className="rag-chatbot__model-badge">RAG</span>
                        <FiChevronDown />
                    </div>
                    <div className="rag-chatbot__header-actions">
                        <button className="rag-chatbot__icon-button" title="Tìm trong cuộc trò chuyện" aria-label="Tìm trong cuộc trò chuyện"><FiSearch /></button>
                        <button className="rag-chatbot__icon-button" title="Tuỳ chọn khác" aria-label="Tuỳ chọn khác"><FiMoreHorizontal /></button>
                    </div>
                </header>

                <div className="rag-chatbot__conversation">
                    {messages.length === 0 && (
                        <div className="rag-chatbot__welcome">
                            <div className="rag-chatbot__welcome-mark"><FiMessageSquare /></div>
                            <h1>Tôi có thể giúp gì cho bạn?</h1>
                            <p>Khám phá dữ liệu Battle Rap bằng hội thoại tự nhiên.</p>
                            <div className="rag-chatbot__quick-prompts">
                                {quickPrompts.map(({ icon: Icon, label }) => (
                                    <button key={label} onClick={() => usePrompt(label)}><Icon /> {label}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <article className={`rag-chatbot__message rag-chatbot__message--${message.role}`} key={message.id}>
                            <div className="rag-chatbot__message-avatar">{message.role === 'assistant' ? <FiMessageSquare /> : <FiUser />}</div>
                            <div className="rag-chatbot__message-body">
                                <div className="rag-chatbot__message-meta">{message.role === 'assistant' ? 'RapMind' : 'Bạn'}</div>
                                <div className="rag-chatbot__message-content">{formatMessage(message.content)}</div>
                                {message.role === 'assistant' && (
                                    <div className="rag-chatbot__message-actions">
                                        <button title="Sao chép" aria-label="Sao chép"><FiCopy /></button>
                                        <button title="Tạo lại câu trả lời" aria-label="Tạo lại câu trả lời"><FiRefreshCw /></button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}

                    {isTyping && <div className="rag-chatbot__typing"><span /><span /><span /></div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="rag-chatbot__composer-wrap">
                    <div className="rag-chatbot__composer">
                        <button className="rag-chatbot__composer-button" title="Đính kèm tệp" aria-label="Đính kèm tệp"><FiPaperclip /></button>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhắn tin cho RapMind..."
                            rows="1"
                            aria-label="Nội dung tin nhắn"
                        />
                        <button className={`rag-chatbot__send${input.trim() ? ' is-active' : ''}`} onClick={handleSend} disabled={!input.trim() || isTyping} title="Gửi tin nhắn" aria-label="Gửi tin nhắn">
                            {input.trim() ? <FiArrowUp /> : <FiSend />}
                        </button>
                    </div>
                    <div className="rag-chatbot__composer-hint"><span><FiGlobe /> RAG đã bật</span><span>RapMind có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.</span></div>
                </div>
            </main>
        </section>
    );
}