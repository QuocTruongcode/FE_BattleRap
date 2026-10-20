import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import EmojiPicker from 'emoji-picker-react';
import { CommentVideo, ReaactionComment } from '../../services/api';
import './Comments.css';
import { useLyricStore } from "../../stores/useLyricStore.js"
import { LuSmilePlus, LuThumbsDown, LuThumbsUp } from "react-icons/lu";

const EMPTY_COMMENT_IDS = new Set();
const COMMENT_BATCH_SIZE = 10;
const REPLY_BATCH_SIZE = 3;

const formatVideoTime = (seconds) => {
    const numericSeconds = Number(seconds);
    if (!Number.isFinite(numericSeconds) || numericSeconds < 0) return null;

    const totalSeconds = Math.floor(numericSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainderSeconds = totalSeconds % 60;
    return `${minutes}:${String(remainderSeconds).padStart(2, '0')}`;
};

const getCommentList = (response) => {
    const comments = Array.isArray(response) ? response : response?.data;
    console.log("Check full comment: ", comments)
    if (!Array.isArray(comments)) {
        throw new Error('Dữ liệu bình luận trả về không hợp lệ.');
    }

    return comments.map((comment, index) => {
        const createdAt = comment.createdAt ?? comment.CreatedAt ?? comment.created_at;
        const parsedDate = createdAt ? new Date(createdAt) : null;
        const totalReply = Number(comment.totalReply ?? comment.TotalReply ?? 0);

        return {
            id: comment.commentID ?? comment.CommentID ?? comment.id ?? index,
            userName: comment.userName ?? comment.User.UserName ?? comment.username ?? 'Người dùng',
            content: comment.content ?? comment.Content ?? comment.comment ?? comment.Comment ?? '',
            like: Math.max(0, Number(comment.like ?? comment.totalLike ?? 0) || 0),
            dissLike: Math.max(0, Number(comment.dissLike ?? comment.totalDissLike ?? 0) || 0),
            barID: comment.barID ?? comment.BarID ?? comment.barId ?? null,
            totalReply: Number.isFinite(totalReply) ? Math.max(0, totalReply) : 0,
            createdAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
        };
    });
};

export default function Comments({
    userName,
    userId,
    className = '',
    resizable = false,
    video,
    bars = [],
}) {
    const [draft, setDraft] = useState('');
    const [sortOrder, setSortOrder] = useState('bar');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [commentReactions, setCommentReactions] = useState({});
    const [replyThreads, setReplyThreads] = useState({});
    const [replySubmitting, setReplySubmitting] = useState({});
    const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyEmojiPickerCommentId, setReplyEmojiPickerCommentId] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiPickerId = useId();
    const [panelWidth, setPanelWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(380);
    const emojiPickerRef = useRef(null);
    const replyEmojiPickerRef = useRef(null);
    const replyTextareaRefs = useRef(new Map());
    const textareaRef = useRef(null);
    const pendingReactionsRef = useRef(new Set());
    const pendingReplyRequestsRef = useRef(new Set());
    const reactionsLoadedRef = useRef(false);
    const queryClient = useQueryClient();
    const videoID = video?.videoID ?? video?.VideoID ?? video?.id ?? video?.videoId;
    const activeLineId = useLyricStore((s) => s.activeLineId);
    const activeBarId = activeLineId?.id ?? activeLineId?.barID ?? activeLineId?.barId;
    const activeBarContent = activeLineId?.content ?? activeLineId?.Content;
    const [revealState, setRevealState] = useState(() => ({
        videoID,
        commentIds: new Set(),
    }));
    const [commentLimitState, setCommentLimitState] = useState(() => ({
        videoID,
        limit: COMMENT_BATCH_SIZE,
    }));

    const {
        data: comments = [],
        isLoading,
        error: commentsError,
        refetch,
    } = useQuery({
        queryKey: ['video-comments', videoID],
        queryFn: async () => getCommentList(await CommentVideo.getCommentsByVideo(videoID)),
        enabled: Boolean(videoID),
    });

    useEffect(() => {
        if (!userId || reactionsLoadedRef.current) return;
        reactionsLoadedRef.current = true;

        ReaactionComment.getMyCommentReactions()
            .then((response) => {
                const reactions = Array.isArray(response) ? response : response?.data;
                if (!Array.isArray(reactions)) {
                    throw new Error('Dữ liệu cảm xúc bình luận trả về không hợp lệ.');
                }

                const myReactions = Object.fromEntries(
                    reactions
                        .map((item) => {
                            const commentId = item.commentID ?? item.CommentID ?? item.commentId;
                            const reaction = item.reaction ?? item.Reaction;
                            const selectedReaction = reaction === 0
                                ? 'like'
                                : reaction === 1
                                    ? 'dissLike'
                                    : null;
                            return commentId == null || !selectedReaction
                                ? null
                                : [String(commentId), selectedReaction];
                        })
                        .filter(Boolean)
                );
                setCommentReactions(myReactions);
            })
            .catch((requestError) => {
                setSubmitError(requestError.message || 'Không thể tải cảm xúc bình luận.');
            });
    }, [userId]);

    const orderedBars = useMemo(() => (
        [...bars].sort((a, b) => (
            Number(a.time ?? a.startTime ?? 0) - Number(b.time ?? b.startTime ?? 0)
        ))
    ), [bars]);
    const barIndexById = useMemo(() => new Map(
        orderedBars.map((bar, index) => {
            const barId = bar.id ?? bar.barID ?? bar.barId ?? bar.BarID;
            return [barId == null ? null : String(barId), index];
        }).filter(([barId]) => barId != null)
    ), [orderedBars]);
    const sortedComments = useMemo(() => (
        [...comments].sort((a, b) => {
            if (sortOrder === 'bar') {
                const aBarIndex = a.barID == null ? -1 : barIndexById.get(String(a.barID)) ?? -1;
                const bBarIndex = b.barID == null ? -1 : barIndexById.get(String(b.barID)) ?? -1;
                return bBarIndex - aBarIndex
                    || (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
            }

            return sortOrder === 'newest'
                ? (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
                : (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
        })
    ), [barIndexById, comments, sortOrder]);
    const barTimeById = useMemo(() => new Map(
        orderedBars
            .map((bar) => {
                const barId = bar.id ?? bar.barID ?? bar.barId ?? bar.BarID;
                const barTime = bar.time ?? bar.startTime ?? bar.StartTime;
                return [barId == null ? null : String(barId), barTime];
            })
            .filter(([barId, barTime]) => barId != null && barTime != null)
    ), [orderedBars]);
    const activeBarIndex = activeBarId == null
        ? null
        : barIndexById.get(String(activeBarId));
    const revealOrder = useMemo(() => {
        if (activeBarIndex == null || orderedBars.length === 0) return [];

        return [...sortedComments]
            .filter((comment) => {
                if (comment.barID == null) return activeBarIndex === orderedBars.length - 1;
                const commentBarIndex = barIndexById.get(String(comment.barID));
                return commentBarIndex != null && commentBarIndex <= activeBarIndex;
            })
            .sort((a, b) => {
                const aIndex = a.barID == null
                    ? orderedBars.length - 1
                    : barIndexById.get(String(a.barID));
                const bIndex = b.barID == null
                    ? orderedBars.length - 1
                    : barIndexById.get(String(b.barID));
                return aIndex - bIndex;
            });
    }, [activeBarIndex, barIndexById, orderedBars.length, sortedComments]);
    const revealOrderRef = useRef(revealOrder);
    const revealedCommentIds = revealState.videoID === videoID
        ? revealState.commentIds
        : EMPTY_COMMENT_IDS;

    useEffect(() => {
        revealOrderRef.current = revealOrder;
    }, [revealOrder]);

    useEffect(() => {
        if (!videoID) return undefined;

        const intervalId = window.setInterval(() => {
            setRevealState((currentState) => {
                const currentIds = currentState.videoID === videoID
                    ? currentState.commentIds
                    : new Set();
                const nextComment = revealOrderRef.current.find(
                    (comment) => !currentIds.has(String(comment.id))
                );
                if (!nextComment) {
                    return currentState.videoID === videoID
                        ? currentState
                        : { videoID, commentIds: currentIds };
                }

                const nextIds = new Set(currentIds);
                nextIds.add(String(nextComment.id));
                return { videoID, commentIds: nextIds };
            });
        }, 350);

        return () => window.clearInterval(intervalId);
    }, [videoID]);

    const visibleComments = revealOrder
        .filter((comment) => revealedCommentIds.has(String(comment.id)))
        .sort((a, b) => {
            if (sortOrder === 'bar') {
                const aBarIndex = a.barID == null ? -1 : barIndexById.get(String(a.barID)) ?? -1;
                const bBarIndex = b.barID == null ? -1 : barIndexById.get(String(b.barID)) ?? -1;
                return bBarIndex - aBarIndex
                    || (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
            }

            const aIsActiveBar = a.barID != null && String(a.barID) === String(activeBarId);
            const bIsActiveBar = b.barID != null && String(b.barID) === String(activeBarId);
            return Number(bIsActiveBar) - Number(aIsActiveBar);
        })
        .slice(0, commentLimitState.videoID === videoID
            ? commentLimitState.limit
            : COMMENT_BATCH_SIZE);
    const currentBarCommentCount = visibleComments.findIndex(
        (comment) => comment.barID == null || String(comment.barID) !== String(activeBarId)
    );
    const hasCurrentAndOlderBarComments = currentBarCommentCount > 0;
    const hasMoreComments = revealOrder.length > (commentLimitState.videoID === videoID
        ? commentLimitState.limit
        : COMMENT_BATCH_SIZE);

    const handleLoadMore = () => {
        setCommentLimitState((currentState) => ({
            videoID,
            limit: (currentState.videoID === videoID
                ? currentState.limit
                : COMMENT_BATCH_SIZE) + COMMENT_BATCH_SIZE,
        }));
    };

    const handleCommentReaction = async (comment, reaction) => {
        const commentId = String(comment.id);
        const previousReaction = commentReactions[commentId] ?? null;
        if (previousReaction === reaction || pendingReactionsRef.current.has(commentId)) return;

        const reactionCounts = { like: 'like', dissLike: 'dissLike' };
        const updateCommentCount = (comments, fromReaction, toReaction) => (
            comments.map((item) => {
                if (String(item.id) !== commentId) return item;

                const nextComment = { ...item };
                if (fromReaction) {
                    nextComment[reactionCounts[fromReaction]] = Math.max(
                        0,
                        nextComment[reactionCounts[fromReaction]] - 1
                    );
                }
                if (toReaction) {
                    nextComment[reactionCounts[toReaction]] += 1;
                }
                return nextComment;
            })
        );
        const updateCachedCount = (fromReaction, toReaction) => {
            queryClient.setQueryData(['video-comments', videoID], (currentComments) => (
                currentComments
                    ? updateCommentCount(currentComments, fromReaction, toReaction)
                    : currentComments
            ));
        };

        pendingReactionsRef.current.add(commentId);
        setCommentReactions((current) => ({ ...current, [commentId]: reaction }));
        updateCachedCount(previousReaction, reaction);
        setSubmitError('');

        try {
            await CommentVideo.createReactionComment({
                commentID: comment.id,
                reaction: reaction === 'like' ? 0 : 1,
            });
        } catch (requestError) {
            setCommentReactions((current) => {
                if (current[commentId] !== reaction) return current;

                const rollback = { ...current };
                if (previousReaction) {
                    rollback[commentId] = previousReaction;
                } else {
                    delete rollback[commentId];
                }
                return rollback;
            });
            updateCachedCount(reaction, previousReaction);
            setSubmitError(requestError.message || 'Không thể cập nhật cảm xúc bình luận.');
        } finally {
            pendingReactionsRef.current.delete(commentId);
        }
    };

    useEffect(() => {
        if (!isResizing) return undefined;

        const handlePointerMove = (event) => {
            const nextWidth = resizeStartWidth.current + (resizeStartX.current - event.clientX);
            const maxWidth = Math.min(720, window.innerWidth * 0.7);
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

    useEffect(() => {
        if (!isEmojiPickerOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!emojiPickerRef.current?.contains(event.target)) {
                setIsEmojiPickerOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [isEmojiPickerOpen]);

    useEffect(() => {
        if (replyEmojiPickerCommentId == null) return undefined;

        const handlePointerDown = (event) => {
            if (!replyEmojiPickerRef.current?.contains(event.target)) {
                setReplyEmojiPickerCommentId(null);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [replyEmojiPickerCommentId]);

    const handleResizeStart = (event) => {
        resizeStartX.current = event.clientX;
        resizeStartWidth.current = panelWidth;
        setIsResizing(true);
    };

    const handleEmojiClick = (emojiData) => {
        const textarea = textareaRef.current;
        const emoji = emojiData.emoji;
        const selectionStart = textarea?.selectionStart ?? draft.length;
        const selectionEnd = textarea?.selectionEnd ?? draft.length;
        const nextDraft = `${draft.slice(0, selectionStart)}${emoji}${draft.slice(selectionEnd)}`;

        if (nextDraft.length > 1000) return;

        setDraft(nextDraft);
        requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(
                selectionStart + emoji.length,
                selectionStart + emoji.length
            );
        });
        setIsEmojiPickerOpen(false);
    };

    const handleReplyEmojiClick = (commentId, emojiData) => {
        const textarea = replyTextareaRefs.current.get(String(commentId));
        const currentDraft = replyDrafts[commentId] ?? '';
        const selectionStart = textarea?.selectionStart ?? currentDraft.length;
        const selectionEnd = textarea?.selectionEnd ?? currentDraft.length;
        const emoji = emojiData.emoji;
        const nextDraft = `${currentDraft.slice(0, selectionStart)}${emoji}${currentDraft.slice(selectionEnd)}`;

        if (nextDraft.length > 1000) return;

        setReplyDrafts((current) => ({ ...current, [commentId]: nextDraft }));
        requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(
                selectionStart + emoji.length,
                selectionStart + emoji.length
            );
        });
        setReplyEmojiPickerCommentId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const content = draft.trim();

        if (!videoID || !content || isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError('');
        try {
            await CommentVideo.create({
                videoID,
                ...(activeBarId != null ? { barID: activeBarId } : {}),
                content,
            });
            setDraft('');
            setIsEmojiPickerOpen(false);
        } catch (requestError) {
            setSubmitError(requestError.message || 'Không thể gửi bình luận.');
            setIsSubmitting(false);
            return;
        }

        try {
            await refetch({ throwOnError: true });
        } catch (requestError) {
            setSubmitError(requestError.message || 'Đã gửi bình luận nhưng không thể tải lại danh sách.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateReplyComment = async (payload, comment) => {
        const commentKey = String(comment.id);
        if (replySubmitting[commentKey]) return;

        const content = payload.content.trim();
        if (!content) return;

        setReplySubmitting((current) => ({ ...current, [commentKey]: true }));
        setSubmitError('');
        try {
            const response = await ReaactionComment.createReplyComment({
                ...payload,
                content,
            });
            const createdReply = response?.data ?? response;
            const createdAt = createdReply?.createdAt ?? createdReply?.CreatedAt ?? new Date().toISOString();
            const reply = {
                ...createdReply,
                id: createdReply?.id ?? createdReply?.replyID ?? createdReply?.ReplyID
                    ?? `temporary-${commentKey}-${replyThreads[commentKey]?.items.length ?? 0}`,
                commentID: createdReply?.commentID ?? createdReply?.CommentID ?? comment.id,
                userID: createdReply?.userID ?? createdReply?.UserID ?? userId,
                replyUserID: createdReply?.replyUserID ?? createdReply?.ReplyUserID ?? payload.replyUserID,
                content: createdReply?.content ?? createdReply?.Content ?? content,
                createdAt,
                User: createdReply?.User ?? { UserName: userName },
                ReplyUser: createdReply?.ReplyUser ?? { UserName: comment.userName },
            };

            setReplyThreads((current) => {
                const thread = current[commentKey] ?? {
                    items: [],
                    visibleCount: 0,
                    isLoading: false,
                };

                return {
                    ...current,
                    [commentKey]: {
                        ...thread,
                        items: [reply, ...thread.items],
                        visibleCount: Math.max(
                            1,
                            Math.min(thread.items.length + 1, Math.max(thread.visibleCount, REPLY_BATCH_SIZE))
                        ),
                    },
                };
            });
            queryClient.setQueryData(['video-comments', videoID], (currentComments) => (
                currentComments?.map((item) => (
                    String(item.id) === commentKey
                        ? { ...item, totalReply: item.totalReply + 1 }
                        : item
                ))
            ));
            setReplyDrafts((current) => {
                const next = { ...current };
                delete next[comment.id];
                return next;
            });
            setActiveReplyCommentId(null);
            setReplyEmojiPickerCommentId(null);
        } catch (requestError) {
            setSubmitError(requestError.message || 'Không thể gửi phản hồi.');
        } finally {
            setReplySubmitting((current) => {
                const next = { ...current };
                delete next[commentKey];
                return next;
            });
        }
    };

    const handleGetReplyCommentsByComment = async (commentID) => {
        const commentKey = String(commentID);
        const currentThread = replyThreads[commentKey];

        if (currentThread) {
            setReplyThreads((current) => ({
                ...current,
                [commentKey]: {
                    ...current[commentKey],
                    visibleCount: currentThread.visibleCount > 0
                        ? 0
                        : Math.min(REPLY_BATCH_SIZE, currentThread.items.length),
                },
            }));
            return;
        }
        if (pendingReplyRequestsRef.current.has(commentKey)) return;

        pendingReplyRequestsRef.current.add(commentKey);
        setSubmitError('');
        setReplyThreads((current) => ({
            ...current,
            [commentKey]: { items: [], visibleCount: 0, isLoading: true },
        }));

        try {
            const response = await ReaactionComment.getReplyCommentsByComment(commentID);
            const replies = Array.isArray(response) ? response : response?.data;
            if (!Array.isArray(replies)) {
                throw new Error('Dữ liệu phản hồi bình luận trả về không hợp lệ.');
            }

            setReplyThreads((current) => ({
                ...current,
                [commentKey]: {
                    items: replies,
                    visibleCount: Math.min(REPLY_BATCH_SIZE, replies.length),
                    isLoading: false,
                },
            }));
        } catch (requestError) {
            setReplyThreads((current) => {
                const next = { ...current };
                delete next[commentKey];
                return next;
            });
            setSubmitError(requestError.message || 'Không thể tải phản hồi bình luận.');
        } finally {
            pendingReplyRequestsRef.current.delete(commentKey);
        }
    };

    const handleLoadMoreReplies = (commentID) => {
        const commentKey = String(commentID);
        setReplyThreads((current) => {
            const thread = current[commentKey];
            if (!thread) return current;

            return {
                ...current,
                [commentKey]: {
                    ...thread,
                    visibleCount: thread.visibleCount >= thread.items.length
                        ? 0
                        : Math.min(thread.visibleCount + REPLY_BATCH_SIZE, thread.items.length),
                },
            };
        });
    };



    return (
        console.log("Check replyThreads: ", replyThreads),
        <section
            className={`video-comments ${className} ${isResizing ? 'is-resizing' : ''}`.trim()}
            style={{ '--comments-panel-width': `${panelWidth}px` }}
            aria-labelledby="video-comments-title"
            onKeyDown={(event) => event.stopPropagation()}
        >
            {resizable && (
                <div
                    className="video-comments__resize-handle"
                    onPointerDown={handleResizeStart}
                    role="separator"
                    aria-label="Điều chỉnh chiều rộng bảng bình luận"
                    aria-orientation="vertical"
                    tabIndex={0}
                />
            )}
            <header className="video-comments__header">
                <h2 id="video-comments-title">Bình luận</h2>
                <span className="video-comments__count">{visibleComments.length}</span>
                <label className="video-comments__sort">
                    <span>Sắp xếp</span>
                    <select
                        aria-label="Sắp xếp bình luận"
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value)}
                    >
                        <option value="bar">Theo bar</option>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                    </select>
                </label>
            </header>

            {activeBarContent && (
                <aside className="video-comments__bar-context" aria-label="Bar đang được bình luận">
                    <span className="video-comments__bar-label">
                        {activeBarId != null ? `Bar #${activeBarId}` : 'Bar đang phát'}
                    </span>
                    <p>{activeBarContent}</p>
                </aside>
            )}

            <form className="video-comments__form" onSubmit={handleSubmit}>
                <span className="video-comments__username">
                    {userName || 'Khách'}
                </span>
                <div className="video-comments__composer">
                    <label>
                        <span className="video-comments__visually-hidden">Viết bình luận</span>
                        <textarea
                            ref={textareaRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder={userName && userId ? 'Viết bình luận...' : 'Đăng nhập để bình luận'}
                            maxLength={1000}
                            rows={2}
                            disabled={!userName || !userId || !videoID}
                        />
                    </label>
                    {userName && userId && videoID && (
                        <div className="video-comments__emoji" ref={emojiPickerRef}>
                            <button
                                type="button"
                                className="video-comments__emoji-trigger"
                                onClick={() => setIsEmojiPickerOpen((isOpen) => !isOpen)}
                                aria-label={isEmojiPickerOpen ? 'Đóng bảng chọn emoji' : 'Thêm emoji'}
                                aria-expanded={isEmojiPickerOpen}
                                aria-controls={emojiPickerId}
                            >
                                <LuSmilePlus size={22} />

                            </button>
                            {isEmojiPickerOpen && (
                                <div id={emojiPickerId} className="video-comments__emoji-picker">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        width="100%"
                                        height={350}
                                        theme="dark"
                                        lazyLoadEmojis
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {userName && userId && draft.trim() && (
                    <div className="video-comments__actions">
                        <button
                            type="button"
                            onClick={() => {
                                setDraft('');
                                setIsEmojiPickerOpen(false);
                            }}
                        >
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang gửi...' : 'Bình luận'}
                        </button>
                    </div>
                )}
            </form>

            {(commentsError || submitError) && (
                <p className="video-comments__error" role="alert">
                    {submitError || commentsError.message || 'Không thể tải bình luận.'}
                </p>
            )}
            {isLoading ? (
                <p className="video-comments__empty" role="status">Đang tải bình luận...</p>
            ) : visibleComments.length > 0 ? (
                <>
                    <ul className="video-comments__list">
                        {visibleComments.map((comment, index) => {
                            const isFirstOlderComment = hasCurrentAndOlderBarComments
                                && index === currentBarCommentCount;
                            const commentBarTime = comment.barID == null
                                ? null
                                : formatVideoTime(
                                    String(comment.barID) === String(activeBarId)
                                        ? activeLineId?.time ?? barTimeById.get(String(comment.barID))
                                        : barTimeById.get(String(comment.barID))
                                );
                            const replyThread = replyThreads[String(comment.id)];

                            return (
                                <Fragment key={comment.id}>
                                    {isFirstOlderComment && (
                                        <li className="video-comments__bar-divider" role="separator">
                                            <span>
                                                Bình luận bar hiện tại
                                                {activeBarId != null ? ` · #${activeBarId}` : ''}
                                            </span>
                                        </li>
                                    )}
                                    <li className="video-comments__item">
                                        <div className="video-comments__meta">
                                            <span className="video-comments__username">{comment.userName}</span>
                                            {commentBarTime && (
                                                <span className="video-comments__video-time">{commentBarTime}</span>
                                            )}
                                            {comment.createdAt && (
                                                <time dateTime={comment.createdAt.toISOString()}>
                                                    {comment.createdAt.toLocaleDateString('vi-VN')}
                                                </time>
                                            )}
                                        </div>
                                        <p>{comment.content}</p>
                                        <div className="video-comments__item-actions">
                                            <button
                                                type="button"
                                                className={commentReactions[String(comment.id)] === 'like' ? 'is-active' : ''}
                                                aria-label="Thích bình luận"
                                                title="Thích"
                                                aria-pressed={commentReactions[String(comment.id)] === 'like'}
                                                onClick={() => handleCommentReaction(comment, 'like')}
                                            >
                                                <LuThumbsUp aria-hidden="true" />
                                                <span>{comment.like}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={commentReactions[String(comment.id)] === 'dissLike' ? 'is-active' : ''}
                                                aria-label="Không thích bình luận"
                                                title="Không thích"
                                                aria-pressed={commentReactions[String(comment.id)] === 'dissLike'}
                                                onClick={() => handleCommentReaction(comment, 'dissLike')}
                                            >
                                                <LuThumbsDown aria-hidden="true" />
                                                <span>{comment.dissLike}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="video-comments__reply"
                                                aria-expanded={String(activeReplyCommentId) === String(comment.id)}
                                                onClick={() => {
                                                    setActiveReplyCommentId((currentId) => (
                                                        String(currentId) === String(comment.id) ? null : comment.id
                                                    ));
                                                    setReplyEmojiPickerCommentId(null);
                                                }}
                                            >
                                                Phản hồi
                                            </button>
                                        </div>
                                        {comment.totalReply > 0 && (
                                            <button
                                                type="button"
                                                className="video-comments__reply-count"
                                                aria-expanded={Boolean(replyThread?.visibleCount)}
                                                disabled={replyThread?.isLoading}
                                                onClick={() => handleGetReplyCommentsByComment(comment.id)}
                                            >
                                                {replyThread?.isLoading
                                                    ? 'Đang tải phản hồi...'
                                                    : `${comment.totalReply} phản hồi`}
                                            </button>
                                        )}
                                        {replyThread?.visibleCount > 0 && (
                                            <div className="video-comments__reply-thread">
                                                {replyThread.items
                                                    .slice(0, replyThread.visibleCount)
                                                    .map((reply, replyIndex) => {
                                                        const createdAtValue = reply.createdAt ?? reply.CreatedAt;
                                                        const createdAt = createdAtValue
                                                            ? new Date(createdAtValue)
                                                            : null;
                                                        const isValidDate = createdAt
                                                            && !Number.isNaN(createdAt.getTime());
                                                        const replyUserName = reply.User?.UserName
                                                            ?? reply.userName
                                                            ?? 'Người dùng';
                                                        const mentionedUserName = reply.ReplyUser?.UserName
                                                            ?? reply.replyUserName
                                                            ?? reply.replyUsername
                                                            ?? 'người dùng';

                                                        return (
                                                            <article
                                                                className="video-comments__reply-item"
                                                                key={reply.id ?? reply.replyID ?? replyIndex}
                                                            >
                                                                <div className="video-comments__reply-meta">
                                                                    <span>{replyUserName}</span>
                                                                    {isValidDate && (
                                                                        <time dateTime={createdAt.toISOString()}>
                                                                            {createdAt.toLocaleString('vi-VN')}
                                                                        </time>
                                                                    )}
                                                                </div>
                                                                <p>
                                                                    <span className="video-comments__reply-mention">
                                                                        @{mentionedUserName}
                                                                    </span>
                                                                    {` ${reply.content ?? reply.Content ?? ''}`}
                                                                </p>
                                                            </article>
                                                        );
                                                    })}
                                                <button
                                                    type="button"
                                                    className="video-comments__reply-thread-toggle"
                                                    onClick={() => handleLoadMoreReplies(comment.id)}
                                                >
                                                    {replyThread.visibleCount < replyThread.items.length
                                                        ? 'Xem thêm phản hồi'
                                                        : 'Thu gọn phản hồi'}
                                                </button>
                                            </div>
                                        )}
                                        {String(activeReplyCommentId) === String(comment.id) && (
                                            <div className="video-comments__composer video-comments__reply-composer">
                                                <label>
                                                    <span className="video-comments__visually-hidden">
                                                        Viết phản hồi cho {comment.userName}
                                                    </span>
                                                    <textarea
                                                        ref={(element) => {
                                                            const key = String(comment.id);
                                                            if (element) {
                                                                replyTextareaRefs.current.set(key, element);
                                                            } else {
                                                                replyTextareaRefs.current.delete(key);
                                                            }
                                                        }}
                                                        value={replyDrafts[comment.id] ?? ''}
                                                        onChange={(event) => setReplyDrafts((current) => ({
                                                            ...current,
                                                            [comment.id]: event.target.value,
                                                        }))}
                                                        placeholder={userName && userId
                                                            ? 'Viết phản hồi...'
                                                            : 'Đăng nhập để phản hồi'}
                                                        maxLength={1000}
                                                        rows={2}
                                                        disabled={!userName || !userId || !videoID}
                                                    />
                                                </label>
                                                {userName && userId && videoID && (
                                                    <div
                                                        className="video-comments__reply-emoji"
                                                        ref={replyEmojiPickerRef}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="video-comments__emoji-trigger"
                                                            aria-label="Thêm emoji vào phản hồi"
                                                            aria-expanded={String(replyEmojiPickerCommentId) === String(comment.id)}
                                                            aria-controls={`reply-emoji-picker-${emojiPickerId}-${comment.id}`}
                                                            onClick={() => {
                                                                setIsEmojiPickerOpen(false);
                                                                setReplyEmojiPickerCommentId((currentId) => (
                                                                    String(currentId) === String(comment.id)
                                                                        ? null
                                                                        : comment.id
                                                                ));
                                                            }}
                                                        >
                                                            <LuSmilePlus size={20} />
                                                        </button>
                                                        {String(replyEmojiPickerCommentId) === String(comment.id) && (
                                                            <div
                                                                id={`reply-emoji-picker-${emojiPickerId}-${comment.id}`}
                                                                className="video-comments__emoji-picker"
                                                            >
                                                                <EmojiPicker
                                                                    onEmojiClick={(emojiData) => handleReplyEmojiClick(comment.id, emojiData)}
                                                                    width="100%"
                                                                    height={350}
                                                                    theme="dark"
                                                                    lazyLoadEmojis
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="video-comments__reply-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyDrafts((current) => {
                                                                const next = { ...current };
                                                                delete next[comment.id];
                                                                return next;
                                                            });
                                                            setReplyEmojiPickerCommentId(null);
                                                            setActiveReplyCommentId(null);
                                                        }}
                                                    >
                                                        Hủy
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="video-comments__reply-submit"
                                                        disabled={
                                                            !userName
                                                            || !userId
                                                            || !videoID
                                                            || !replyDrafts[comment.id]?.trim()
                                                            || replySubmitting[String(comment.id)]
                                                        }
                                                        onClick={() => handleCreateReplyComment({
                                                            commentID: comment.id,
                                                            replyUserID: userId,
                                                            content: replyDrafts[comment.id],
                                                        }, comment)}
                                                    >
                                                        {replySubmitting[String(comment.id)] ? 'Đang gửi...' : 'Bình luận'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                </Fragment>
                            );
                        })}
                    </ul>
                    {hasMoreComments && (
                        <button
                            type="button"
                            className="video-comments__load-more"
                            onClick={handleLoadMore}
                        >
                            Xem thêm
                        </button>
                    )}
                </>
            ) : sortedComments.length > 0 ? (
                <p className="video-comments__empty" role="status">
                    Bình luận sẽ xuất hiện theo tiến trình phát video.
                </p>
            ) : (
                <p className="video-comments__empty">
                    Chưa có bình luận nào. Hãy chia sẻ cảm nhận của bạn về trận battle!
                </p>
            )}
        </section>
    );
}
