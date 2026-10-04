import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckTheRhyme } from '../../services/api';

const getMaxPanelWidth = () => Math.min(900, window.innerWidth * 0.9);

function renderSafeNode(node, key) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tagName = node.tagName.toLowerCase();
    if (!['div', 'span', 'br'].includes(tagName)) {
        return Array.from(node.childNodes, (child, index) => renderSafeNode(child, `${key}-${index}`));
    }

    if (tagName === 'br') {
        return <br key={key} />;
    }

    const style = {};
    if (tagName === 'div') {
        if (/^\d+(?:\.\d+)?(?:px|rem|em|%)$/.test(node.style.fontSize)) {
            style.fontSize = node.style.fontSize;
        }
        if (/^\d+(?:\.\d+)?(?:px|rem|em|%)?$/.test(node.style.lineHeight)) {
            style.lineHeight = node.style.lineHeight;
        }
    } else {
        const background = node.style.backgroundColor || node.style.background;
        if (background && /^(?:hsl|hsla|rgb|rgba)\([\d.,%/\s+-]+\)$/i.test(background)) {
            style.backgroundColor = background;
        }
        if (node.style.padding === '1px 3px') style.padding = '1px 3px';
        if (node.style.borderRadius === '4px') style.borderRadius = '4px';
    }

    const children = Array.from(node.childNodes, (child, index) => renderSafeNode(child, `${key}-${index}`));
    return tagName === 'div'
        ? <div key={key} style={style}>{children}</div>
        : <span key={key} style={style}>{children}</span>;
}

function renderRhymeHtml(html) {
    const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(parsedDocument.body.childNodes, (node, index) => renderSafeNode(node, `rhyme-${index}`));
}

export default function RhymePanel({ videoId, onClose }) {
    const [panelWidth, setPanelWidth] = useState(getMaxPanelWidth);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(getMaxPanelWidth());
    const { data: html, isLoading, error } = useQuery({
        queryKey: ['check-the-rhyme', videoId],
        queryFn: async () => {
            const response = await CheckTheRhyme.getRyme(videoId);
            if (typeof response?.data !== 'string' || !response.data.trim()) {
                throw new Error('API không trả về kết quả gieo vần hợp lệ.');
            }
            return response.data;
        },
        enabled: Boolean(videoId),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!isResizing) return undefined;

        const handlePointerMove = (event) => {
            const nextWidth = resizeStartWidth.current + (resizeStartX.current - event.clientX);
            const maxWidth = getMaxPanelWidth();
            setPanelWidth(Math.max(320, Math.min(maxWidth, nextWidth)));
        };

        const handlePointerUp = () => setIsResizing(false);

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

    return (
        console.log('RhymePanel render: ', html),
        <section
            className={`watch-analysis-result ${isResizing ? 'is-resizing' : ''}`}
            style={{ '--watch-analysis-width': `${panelWidth}px` }}
            aria-label="Kiểm tra vần"
        >
            <div
                className="watch-analysis-resize-handle"
                onPointerDown={handleResizeStart}
                role="separator"
                aria-label="Điều chỉnh chiều rộng bảng gieo vần"
                aria-orientation="vertical"
                tabIndex={0}
            />
            <header className="watch-analysis-header">
                <h3>Kiểm tra vần</h3>
                <button type="button" className="watch-analysis-close" onClick={onClose} aria-label="Đóng">
                    ×
                </button>
            </header>
            <div className="watch-analysis-body">
                {isLoading ? (
                    <p>Đang phân tích vần...</p>
                ) : error ? (
                    <p className="is-error">{error.message || 'Không thể tải kết quả gieo vần.'}</p>
                ) : html ? (
                    <div className="watch-rhyme-result">{renderRhymeHtml(html)}</div>
                ) : (
                    <p>Chưa có kết quả gieo vần.</p>
                )}
            </div>
        </section>
    );
}