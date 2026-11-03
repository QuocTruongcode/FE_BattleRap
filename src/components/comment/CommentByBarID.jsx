import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuThumbsDown, LuThumbsUp } from 'react-icons/lu';
import { FaHandPointRight } from "react-icons/fa";
import { CommentVideo, ReaactionComment } from '../../services/api';
import './Comments.css';

const REPLY_BATCH_SIZE = 3;

const getBarComments = (response) => {
    const comments = Array.isArray(response) ? response : response?.data;
    if (!Array.isArray(comments)) {
        throw new Error('Dữ liệu bình luận trả về không hợp lệ.');
    }

    return comments.map((comment, index) => {
        const createdAt = comment.createdAt ?? comment.CreatedAt ?? comment.created_at;
        const parsedDate = createdAt ? new Date(createdAt) : null;

        return {
            id: comment.id ?? comment.commentID ?? comment.CommentID ?? index,
            userName: comment.User?.UserName ?? comment.userName ?? comment.username ?? 'Người dùng',
            content: comment.content ?? comment.Content ?? '',
            totalLike: Number(comment.totalLike ?? comment.like ?? 0) || 0,
            totalDissLike: Number(comment.totalDissLike ?? comment.dissLike ?? 0) || 0,
            totalReply: Number(comment.totalReply ?? comment.TotalReply ?? 0) || 0,
            createdAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
        };
    });
};

export default function CommentByBarID({ barID, barTime, onJoinComments }) {
    const [replyThreads, setReplyThreads] = useState({});
    const commentsQueryKey = ['bar-comments', barID];

    const {
        data: comments = [],
        isLoading,
        error: commentsError,
    } = useQuery({
        queryKey: commentsQueryKey,
        queryFn: async () => getBarComments(await CommentVideo.getCommentsByBar(barID)),
        enabled: barID != null,
    });

    const handleToggleReplies = async (commentID) => {
        const commentKey = String(commentID);
        const thread = replyThreads[commentKey];

        if (thread && !thread.error) {
            const directReplyCount = thread.items.length;
            setReplyThreads((current) => ({
                ...current,
                [commentKey]: {
                    ...current[commentKey],
                    visibleCount: current[commentKey].visibleCount > 0
                        ? 0
                        : Math.min(REPLY_BATCH_SIZE, directReplyCount),
                },
            }));
            return;
        }

        setReplyThreads((current) => ({
            ...current,
            [commentKey]: { items: [], visibleCount: 0, isLoading: true, error: '' },
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
                    error: '',
                },
            }));
        } catch (requestError) {
            setReplyThreads((current) => ({
                ...current,
                [commentKey]: {
                    items: [],
                    visibleCount: 0,
                    isLoading: false,
                    error: requestError.message || 'Không thể tải phản hồi bình luận.',
                },
            }));
        }
    };

    const handleShowMoreReplies = (commentID) => {
        const commentKey = String(commentID);
        setReplyThreads((current) => {
            const thread = current[commentKey];
            if (!thread) return current;

            const nextVisibleCount = thread.visibleCount >= thread.items.length
                ? 0
                : Math.min(thread.visibleCount + REPLY_BATCH_SIZE, thread.items.length);

            return {
                ...current,
                [commentKey]: { ...thread, visibleCount: nextVisibleCount },
            };
        });
    };

    return (
        <section className="video-comments video-comments--bar" aria-label="Bình luận cho bar">
            <header className="video-comments__header">
                <h2>Bình luận về bar</h2>
                <span className="video-comments__count">{comments.length}</span>
            </header>

            <button
                type="button"
                className="video-comments__join"
                onClick={() => onJoinComments?.(barTime)}
            >
                <FaHandPointRight size={24} />
                Tham gia bình luận về bar này tại đây
            </button>

            {commentsError && (
                <p className="video-comments__error" role="alert">
                    {commentsError.message || 'Không thể tải bình luận.'}
                </p>
            )}

            {isLoading ? (
                <p className="video-comments__empty" role="status">Đang tải bình luận...</p>
            ) : comments.length > 0 ? (
                <ul className="video-comments__list">
                    {comments.map((comment) => (
                        <li className="video-comments__item" key={comment.id}>
                            <div className="video-comments__meta">
                                <span className="video-comments__username">{comment.userName}</span>
                                {comment.createdAt && (
                                    <time dateTime={comment.createdAt.toISOString()}>
                                        {comment.createdAt.toLocaleDateString('vi-VN')}
                                    </time>
                                )}
                            </div>
                            <p>{comment.content}</p>
                            <div className="video-comments__item-actions" aria-label="Thống kê bình luận">
                                <span aria-label={`Thích ${comment.totalLike}`}>
                                    <LuThumbsUp aria-hidden="true" />
                                    {comment.totalLike}
                                </span>
                                <span aria-label={`Không thích ${comment.totalDissLike}`}>
                                    <LuThumbsDown aria-hidden="true" />
                                    {comment.totalDissLike}
                                </span>
                                {comment.totalReply > 0 && (
                                    <button
                                        type="button"
                                        className="video-comments__reply-count"
                                        aria-expanded={(replyThreads[String(comment.id)]?.visibleCount ?? 0) > 0}
                                        disabled={replyThreads[String(comment.id)]?.isLoading}
                                        onClick={() => handleToggleReplies(comment.id)}
                                    >
                                        {replyThreads[String(comment.id)]?.isLoading
                                            ? 'Đang tải phản hồi...'
                                            : `${comment.totalReply} phản hồi`}
                                    </button>
                                )}
                            </div>
                            {replyThreads[String(comment.id)]?.error && (
                                <p className="video-comments__error" role="alert">
                                    {replyThreads[String(comment.id)].error}
                                </p>
                            )}
                            {(replyThreads[String(comment.id)]?.visibleCount ?? 0) > 0 && (
                                <div className="video-comments__reply-thread">
                                    {replyThreads[String(comment.id)].items
                                        .slice(0, replyThreads[String(comment.id)].visibleCount)
                                        .map((reply, index) => {
                                            const createdAtValue = reply.createdAt ?? reply.CreatedAt;
                                            const createdAt = createdAtValue ? new Date(createdAtValue) : null;
                                            const hasValidDate = createdAt && !Number.isNaN(createdAt.getTime());
                                            const mentionedUserName = reply.ReplyUser?.UserName
                                                ?? reply.replyUserName
                                                ?? reply.replyUsername;

                                            return (
                                                <article
                                                    className="video-comments__reply-item"
                                                    key={reply.id ?? reply.replyID ?? reply.ReplyID ?? index}
                                                >
                                                    <div className="video-comments__reply-meta">
                                                        <span>
                                                            {reply.User?.UserName ?? reply.userName ?? 'Người dùng'}
                                                        </span>
                                                        {hasValidDate && (
                                                            <time dateTime={createdAt.toISOString()}>
                                                                {createdAt.toLocaleString('vi-VN')}
                                                            </time>
                                                        )}
                                                    </div>
                                                    <p>
                                                        {mentionedUserName && (
                                                            <span className="video-comments__reply-mention">
                                                                @{mentionedUserName}
                                                            </span>
                                                        )}
                                                        {mentionedUserName ? ' ' : ''}
                                                        {reply.content ?? reply.Content ?? ''}
                                                    </p>
                                                </article>
                                            );
                                        })}
                                    <button
                                        type="button"
                                        className="video-comments__reply-thread-toggle"
                                        onClick={() => handleShowMoreReplies(comment.id)}
                                    >
                                        {replyThreads[String(comment.id)].visibleCount
                                            < replyThreads[String(comment.id)].items.length
                                            ? 'Xem thêm phản hồi'
                                            : 'Thu gọn phản hồi'}
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="video-comments__empty">Chưa có bình luận nào cho bar này.</p>
            )}
        </section>
    );
}
