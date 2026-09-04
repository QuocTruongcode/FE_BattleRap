import { useEffect, useRef, useState, Fragment } from 'react';
import './ReactionBar.css';
import { REACTION_KEY_MAP } from '../../constants/const.js';
import { REACTIONS_ICONS } from "../../constants/const.js";


const reactions = REACTIONS_ICONS; // sử dụng mảng REACTIONS_ICONS từ const.js

const DEFAULT_FOCUS_INDEX = reactions.findIndex(r => r.id === REACTION_KEY_MAP.normal); // mặc định focus vào "Bình thường"

export default function ReactionBar({ onSelect, onSpaceKey }) {
    const buttonRefs = useRef([]);
    const [activeIndex, setActiveIndex] = useState(DEFAULT_FOCUS_INDEX);

    // Thử focus lúc mount — chỉ mang tính hỗ trợ visual (:focus-visible nếu có),
    // KHÔNG còn là nguồn quyết định logic bắt phím nữa.
    useEffect(() => {
        buttonRefs.current[activeIndex]?.focus();
    }, [activeIndex]);

    // Lắng nghe phím ở document — không phụ thuộc việc button có đang thực sự
    // giữ focus của trình duyệt hay không (miễn nhiễm với visibility: hidden trên ancestor)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % reactions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + reactions.length) % reactions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                setActiveIndex((prev) => {
                    handleSelect(reactions[prev].id);
                    return prev; // không đổi index, chỉ mượn functional-update để lấy đúng giá trị mới nhất
                });
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                onSpaceKey?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onSelect, onSpaceKey]);

    const handleSelect = (reactionId) => {
        console.log('Selected reaction 2:', reactionId);
        onSelect?.(reactionId);
    };

    return (
        <aside className="reactionBar" aria-label="Reaction bar">
            <div className="reactionBar__list">
                {reactions.map((reaction, index) => {
                    const Icon = reaction.icon;
                    const isActive = index === activeIndex;

                    return (
                        <Fragment key={reaction.id}>
                            <button
                                ref={(el) => (buttonRefs.current[index] = el)}
                                type="button"
                                className={
                                    'reactionBar__item' +
                                    (isActive ? ' reactionBar__item--active' : '')
                                }
                                onClick={() => onSelect?.(reaction.id)}

                                onFocus={() => setActiveIndex(index)}
                            >
                                <span
                                    className="reactionBar__icon"
                                    aria-hidden="true"
                                    style={{ color: reaction.color }}
                                >
                                    <Icon />
                                </span>

                                <span className="reactionBar__label">
                                    {reaction.label}
                                </span>
                            </button>

                            {(index === 1 || index === 2) && (
                                <div className="reactionBar__divider" />
                            )}
                        </Fragment>
                    );
                })}
            </div>
        </aside>
    );
}