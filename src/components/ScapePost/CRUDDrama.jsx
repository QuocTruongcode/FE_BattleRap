import { Fragment, useEffect, useState } from 'react';
import './CRUDDrama.css';
import { FacebookPosts, Drama, searchService, ChunkService } from '../../services/api';
import { EditReview, ModalReview } from '../review';
import ViewPostDrama from './ViewPostDrama';
const DEFAULT_VALUE = {
    links: ['https://www.facebook.com/grabfanthang9'],
    onlyPostsNewerThan: '',
    onlyPostsOlderThan: '',
    urlPost: '',
};

function EventVideoTitleSearch({ selectedTitle, videoID, onSelect }) {
    const [query, setQuery] = useState(videoID == null ? '' : String(videoID));
    const [videoResults, setVideoResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const keyword = query.trim();
        if (videoID != null && keyword === String(videoID)) return undefined;
        if (selectedTitle?.title === keyword) return undefined;

        if (!keyword) return undefined;
        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            setIsSearching(true);
            setError(null);
            try {
                const response = await searchService.search(keyword, { signal: controller.signal });
                console.log("Check response: ", response)
                if (controller.signal.aborted) return;
                if (!Array.isArray(response?.data)) {
                    throw new Error('Dữ liệu video tìm kiếm trả về không hợp lệ.');
                }
                const videos = response.data.filter(
                    (video) => typeof video?.title === 'string' && video.title.trim()
                );
                setVideoResults(videos);
            } catch (searchError) {
                if (controller.signal.aborted) return;
                console.error('Failed to search video titles:', searchError);
                setVideoResults([]);
                setError('Tìm video thất bại. Vui lòng thử lại.');
            } finally {
                if (!controller.signal.aborted) setIsSearching(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [query, selectedTitle, videoID]);

    return (
        console.log("Check selectedTitle: ", selectedTitle),

        <div className="crud-drama-video-title-search">
            <label className="crud-drama-field">
                <span className="crud-drama-label">Tìm tên video</span>
                <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                        onSelect(null);
                        setQuery(event.target.value);
                        setVideoResults([]);
                        setError(null);
                        setIsSearching(Boolean(event.target.value.trim()));
                    }}
                    placeholder="Nhập tên video"
                    aria-label="Tìm tên video"
                    aria-autocomplete="list"
                />
            </label>
            {isSearching && <p className="crud-drama-search-empty" role="status">Đang tìm video...</p>}
            {error && <p className="crud-drama-video-search-error" role="alert">{error}</p>}
            {/* {!isSearching && !error && query.trim() && videoResults.length === 0 && (
                <p className="crud-drama-search-empty">Không tìm thấy video phù hợp.</p>
            )} */}
            {videoResults.length > 0 && (
                <div className="crud-drama-search-results" role="listbox" aria-label="Kết quả video">
                    {videoResults.map((video, index) => (
                        <button
                            className="crud-drama-search-result"
                            type="button"
                            role="option"
                            aria-selected={selectedTitle === video}
                            key={`${video.title}-${index}`}
                            onClick={() => {
                                onSelect(video);
                                setQuery(video.title);
                                setVideoResults([]);
                                setError(null);
                                setIsSearching(false);
                            }}
                        >
                            {video.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function getInitialValue(initialValue) {
    return {
        links: Array.isArray(initialValue?.links)
            ? [...initialValue.links]
            : [...DEFAULT_VALUE.links],
        onlyPostsNewerThan: initialValue?.onlyPostsNewerThan ?? DEFAULT_VALUE.onlyPostsNewerThan,
        onlyPostsOlderThan: initialValue?.onlyPostsOlderThan ?? DEFAULT_VALUE.onlyPostsOlderThan,
        urlPost: initialValue?.urlPost ?? DEFAULT_VALUE.urlPost,
    };
}

export default function CRUDDrama({
    initialValue,
    onChange,
    onSubmit,
    selectedPosts = [],
    onRemoveSelectedPost,
}) {
    const [formValue, setFormValue] = useState(() => getInitialValue(initialValue));
    const [dramaQuery, setDramaQuery] = useState('');
    const [dramaID, setDramaID] = useState(null);
    const [dramaSearchResults, setDramaSearchResults] = useState(null);
    const [isSearchingDramas, setIsSearchingDramas] = useState(false);
    const [isSubmittingDramaEvent, setIsSubmittingDramaEvent] = useState(false);
    const [deletingDramaEventID, setDeletingDramaEventID] = useState(null);
    const [dramaEvent, setDramaEvent] = useState([]);
    const [selectedVideoByItem, setSelectedVideoByItem] = useState({});
    const [reviewDraft, setReviewDraft] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReviewingDrama, setIsReviewingDrama] = useState(false);

    const updateValue = (nextValue) => {
        setFormValue(nextValue);
        onChange?.(nextValue);
    };

    const updateLink = (index, link) => {
        const links = formValue.links.map((currentLink, currentIndex) => (
            currentIndex === index ? link : currentLink
        ));
        updateValue({ ...formValue, links });
    };

    const addLink = () => {
        updateValue({ ...formValue, links: [...formValue.links, ''] });
    };

    const removeLink = (index) => {
        updateValue({
            ...formValue,
            links: formValue.links.filter((_, currentIndex) => currentIndex !== index),
        });
    };

    const updateDate = (field, value) => {
        updateValue({ ...formValue, [field]: value });
    };

    const setSelectedVideoForItem = (itemKey, video) => {
        setSelectedVideoByItem((current) => ({ ...current, [itemKey]: video }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsSubmittingDramaEvent(true);
            if (formValue.urlPost.trim()) {
                setIsSubmittingDramaEvent(true);
                console.log("Check url: ", formValue.urlPost.trim())
                const APost = await FacebookPosts.scrapeAPost({ url: formValue.urlPost.trim() })
                console.log("Check APost: ", APost)
                onSubmit?.(APost.data);
            }
            else {
                const posts = await FacebookPosts.scrapeFacebookPosts(formValue);
                if (!Array.isArray(posts?.data)) {
                    throw new Error('Dữ liệu bài đăng trả về không hợp lệ.');
                }
                onSubmit?.(posts.data);
            }

        } catch (e) {
            console.error('Failed to scrape Facebook posts:', e);
            alert('Lấy bài đăng thất bại.');
        } finally {
            setIsSubmittingDramaEvent(false);
        }
    };



    const submitDrama = async (event) => {
        event.preventDefault();
        try {
            const dramaItems = await Drama.create({ title: dramaQuery });
            console.log('Drama created:', dramaItems);
            setDramaID(dramaItems.data.id);

        } catch (e) {
            console.error('Failed to create drama items:', e);
            alert('Tạo drama thất bại.');

        };
    }

    const submitDramaEvent = async (Posts) => {
        try {
            if (dramaID === null) {
                alert('Vui lòng tạo drama trước khi thêm sự kiện.');
                return;
            }
            setIsSubmittingDramaEvent(true);
            const newPosts = Posts.filter((post) => post.id == null);
            const comments = newPosts.length > 0 ? await getCommentsPost(newPosts) : [];
            const commentsByPost = new Map(newPosts.map((post, index) => [post, comments[index] ?? '']));
            const dramaEvents = Posts.map((post) => ({
                ...(post.id != null ? { id: post.id } : {}),
                ...(post.videoID != null ? { videoID: post.videoID } : {}),
                link: post.link ?? post.url,
                title: post.title ?? post.text,
                review: post.review ?? commentsByPost.get(post) ?? '',
                dramaID,
                facebookUrl: post.facebookUrl,
                pageName: post.pageName,
                time: post.time,
                postId: post.postId,
            }));
            const dramaItems = await Drama.bulkCreate(dramaEvents);
            console.log('Drama events saved:', dramaItems);
            alert('Lưu drama event thành công.');


        } catch (e) {
            console.error('Failed to save drama events:', e);
            alert('Lưu drama event thất bại.');
        } finally {
            setIsSubmittingDramaEvent(false);
        }
    };

    const getCommentsPost = async (Posts) => {
        try {
            const links = Posts.map((post) => post.link ?? post.url);
            const comments = await Drama.scrapeFacebookComments({ links });
            console.log("Check comments: ", comments.data);
            return comments.data;
        } catch {
            alert("Việc lấy comment thất bại")
            return [];
        }
    };

    const handleSearchDramas = async () => {
        const keyword = dramaQuery.trim();
        if (!keyword) {
            setDramaSearchResults([]);
            return;
        }

        setIsSearchingDramas(true);
        setDramaSearchResults(null);
        try {
            const drama = await searchService.searchDramas(keyword);
            if (!Array.isArray(drama?.data)) {
                throw new Error('Dữ liệu drama tìm kiếm trả về không hợp lệ.');
            }
            setDramaSearchResults(drama.data);
        } catch (e) {
            console.error('Failed to search dramas:', e);
            alert('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
        } finally {
            setIsSearchingDramas(false);
        }
    };

    const handleGetDramaEvents = async (dramaID) => {
        try {
            if (dramaID === null) {
                alert('Vui lòng chọn drama trước khi lấy sự kiện.');
                return;
            }
            const dramaEvents = await Drama.getAllDramaEventByDramaID(dramaID);
            // console.log("Check drama events: ", dramaEvents.data);
            setDramaEvent(dramaEvents.data)
            // return dramaEvents.data;
        } catch {
            alert("Việc lấy drama events thất bại")
            return [];
        }
    };

    const handleDeleteDramaEvent = async (eventID) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa drama event này không?')) return;

        setDeletingDramaEventID(eventID);
        try {
            await Drama.deleteDramaEvent(eventID);
            setDramaEvent((currentEvents) => currentEvents.filter((event) => event.id !== eventID));
        } catch (e) {
            console.error('Failed to delete drama event:', e);
            alert('Xóa drama event thất bại.');
        } finally {
            setDeletingDramaEventID(null);
        }
    };

    const ReviewDrama = async (dramaID) => {
        try {
            // setIsSubmittingDramaEvent(false);

            if (dramaID === null) {
                alert('Vui lòng chọn drama trước khi xem đánh giá.');
                return;
            }
            const reviewed = await Drama.getDramaByID(dramaID)
            console.log("Check reviewed drama: ", reviewed.data.summary)
            if (reviewed?.data?.summary === null) {
                setReviewDraft("Chưa có đánh giá drama này, vui lòng nhấn Review bằng AI để tạo đánh giá drama.")
                setIsReviewModalOpen(true);

                return;
            }
            setReviewDraft(reviewed.data.summary);

            setIsReviewModalOpen(true);
        } catch (error) {
            console.error('Review drama error:', error);
            alert('Có lỗi xảy ra khi xem đánh giá drama.');
        } finally {
            // setIsSubmittingDramaEvent(true);
        }
    };

    const handleReviewDramaWithAi = async () => {
        if (dramaID === null) {
            alert('Vui lòng chọn drama trước khi đánh giá bằng AI.');
            return;
        }

        setIsReviewingDrama(true);
        try {
            const review = await Drama.reviewDrama(dramaID);
            if (typeof review?.data?.message !== 'string') {
                throw new Error('Nội dung review drama trả về không hợp lệ.');
            }
            setReviewDraft(review.data.message);
        } catch (error) {
            console.error('AI review drama error:', error);
            alert('Có lỗi xảy ra khi đánh giá drama bằng AI.');
        } finally {
            setIsReviewingDrama(false);
        }
    };

    const updateDramaReview = async (dramaID, reviewContent) => {
        try {
            if (dramaID === null) {
                alert('Vui lòng chọn drama trước khi cập nhật đánh giá.');
                return;
            }
            const res = await Drama.update(dramaID, { summary: reviewContent });
            console.log('Drama review updated:', res);
            // setReviewDrama(reviewContent);
            // setReviewDraft(reviewContent);
        } catch (error) {
            console.error('Update drama review error:', error);
            alert('Có lỗi xảy ra khi cập nhật đánh giá drama.');
        }
    };

    const handleSaveToVectorDB = async (dramaID) => {
        try {
            const req = await ChunkService.upsertChunkDrama(dramaID);
            if (req.success === true) {
                alert("Lưu vào vectorDB thành công!")
            }
        } catch (e) {
            alert("Lưu vào vetorDB thất bại!")
        }
    }

    return (
        // console.log("Check reviewDraft: ", reviewDraft),
        // console.log("Check reviewDrama: ", reviewDrama),
        console.log("Check dramaEvent: ", dramaEvent),
        <div className="crud-drama-forms">
            <ModalReview
                isOpen={isReviewModalOpen}
                title="Đánh giá Drama"
                onClose={() => { setIsReviewModalOpen(false) }}
                onReviewAi={handleReviewDramaWithAi}
                isAnalyzing={isReviewingDrama}
                progressMessage="Đang đánh giá drama bằng AI"
                onSave={() => {
                    // setIsReviewModalOpen(false);
                    console.log("Saved: ");
                    // onClick={() => updateDramaReview(dramaID, reviewDraft);
                    updateDramaReview(dramaID, reviewDraft);
                }}
                onCancel={() => setIsReviewModalOpen(false)}
            >
                <EditReview
                    key={dramaID}
                    markdown={reviewDraft}
                    onChange={setReviewDraft}
                />
            </ModalReview>

            <form className="crud-drama-panel" aria-label="Cấu hình bài đăng Drama" onSubmit={handleSubmit}>
                <h2 className="crud-drama-title">Cấu hình bài đăng</h2>

                <div className="crud-drama-field">
                    <span className="crud-drama-label">Links</span>
                    <div className="crud-drama-links">
                        {formValue.links.length > 0 ? formValue.links.map((link, index) => (
                            <div className="crud-drama-link-row" key={index}>
                                <input
                                    type="text"
                                    value={link}
                                    onChange={(event) => updateLink(index, event.target.value)}
                                    placeholder="Nhập đường dẫn"
                                    aria-label={`Link ${index + 1}`}
                                    required
                                />
                                <button
                                    type="button"
                                    className="crud-drama-icon-button"
                                    onClick={addLink}
                                    aria-label="Thêm link"
                                    title="Thêm link"
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    className="crud-drama-icon-button crud-drama-remove-button"
                                    onClick={() => removeLink(index)}
                                    aria-label={`Xóa link ${index + 1}`}
                                    title="Xóa link"
                                >
                                    -
                                </button>
                            </div>
                        )) : (
                            <button
                                type="button"
                                className="crud-drama-icon-button crud-drama-empty-add"
                                onClick={addLink}
                                aria-label="Thêm link"
                                title="Thêm link"
                            >
                                +
                            </button>
                        )}
                    </div>
                </div>

                <label className="crud-drama-field" htmlFor="crud-drama-post-url">
                    <span className="crud-drama-label">URL post</span>
                    <input
                        id="crud-drama-post-url"
                        type="url"
                        value={formValue.urlPost}
                        onChange={(event) => updateValue({ ...formValue, urlPost: event.target.value })}
                        placeholder="Nhập URL post(Nhập để lấy riêng 1 bài post)"
                    />
                </label>

                <label className="crud-drama-field" htmlFor="crud-drama-newer-than">
                    <span className="crud-drama-label">Bài đăng mới hơn từ</span>
                    <input
                        id="crud-drama-newer-than"
                        type="date"
                        value={formValue.onlyPostsNewerThan}
                        onChange={(event) => updateDate('onlyPostsNewerThan', event.target.value)}
                    />
                </label>

                <label className="crud-drama-field" htmlFor="crud-drama-older-than">
                    <span className="crud-drama-label">Bài đăng cũ hơn đến</span>
                    <input
                        id="crud-drama-older-than"
                        type="date"
                        value={formValue.onlyPostsOlderThan}
                        onChange={(event) => updateDate('onlyPostsOlderThan', event.target.value)}
                    />
                </label>

                <button className="crud-drama-submit-button" type="submit" disabled={isSubmittingDramaEvent}>
                    Đồng ý
                </button>
            </form>

            <section className="crud-drama-panel" aria-label="Drama title">
                <form
                    className="crud-drama-search-form"
                    onSubmit={submitDrama}
                >
                    <label className="crud-drama-field" htmlFor="crud-drama-search">
                        <span className="crud-drama-label">Tìm kiếm drama</span>
                        <input
                            id="crud-drama-search"
                            type="search"
                            value={dramaQuery}
                            onChange={(event) => {
                                setDramaQuery(event.target.value);
                                setDramaID(null);
                                setDramaSearchResults(null);
                            }}
                            placeholder="Nhập tên drama"
                            required
                        />
                    </label>
                    <div className="crud-drama-actions">
                        <button
                            className="crud-drama-submit-button crud-drama-action-add"
                            type="submit"

                        >
                            Thêm
                        </button>
                        <button
                            className="crud-drama-submit-button crud-drama-action-search"
                            type="button"
                            onClick={handleSearchDramas}
                            disabled={isSearchingDramas || !dramaQuery.trim()}
                        >
                            {isSearchingDramas ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                        <button
                            className="crud-drama-submit-button crud-drama-action-review"
                            type="button"
                            onClick={() => ReviewDrama(dramaID)}
                            disabled={isSubmittingDramaEvent || dramaID === null}
                        >
                            Review
                        </button>
                    </div>
                    <button
                        className="crud-drama-submit-button crud-drama-action-save"
                        type="button"
                        onClick={() => handleSaveToVectorDB(dramaID)}
                        disabled={isSubmittingDramaEvent || dramaID === null}
                    >
                        Lưu xuống vectorDB
                    </button>
                </form>
                {dramaSearchResults !== null && (
                    <div className="crud-drama-search-results" aria-live="polite">
                        {dramaSearchResults.length > 0 ? (
                            dramaSearchResults.map((drama, index) => (
                                <button
                                    className={`crud-drama-search-result${dramaID === drama.id ? ' is-selected' : ''}`}
                                    type="button"
                                    key={drama.id ?? `${drama.title}-${index}`}
                                    aria-pressed={dramaID === drama.id}
                                    onClick={() => {
                                        setDramaQuery(drama.title);
                                        setDramaID(drama.id ?? null);
                                        handleGetDramaEvents(drama.id ?? null);
                                    }}
                                >
                                    {drama.title}
                                </button>
                            ))
                        ) : (
                            <p className="crud-drama-search-empty">Không tìm thấy drama phù hợp.</p>
                        )}
                    </div>
                )}
            </section>

            {(dramaEvent.length > 0 || selectedPosts.length > 0) && (
                <section className="crud-drama-panel crud-drama-selected-post" aria-label="Bài đăng đã chọn">
                    <h2 className="crud-drama-title">Các sự kiện của Drama có tên: "{dramaQuery}"</h2>
                    {dramaEvent.length > 0 && (
                        <>
                            <h3 className="crud-drama-title">Sự kiện đã có</h3>
                            {dramaEvent.map((event, index) => (
                                <Fragment key={`event-${event.id ?? event.postId ?? event.link ?? index}`}>
                                    <EventVideoTitleSearch
                                        selectedTitle={selectedVideoByItem[`event-${event.id ?? event.postId ?? event.link ?? index}`] ?? event.video}
                                        videoID={event.videoID}
                                        onSelect={(video) => setSelectedVideoForItem(
                                            `event-${event.id ?? event.postId ?? event.link ?? index}`,
                                            video
                                        )}
                                    />
                                    <div className="crud-drama-selected-post-item">
                                        <ViewPostDrama
                                            post={{ ...event, url: event.link, text: event.title }}
                                            embedWidth={420}
                                        />
                                        <button
                                            className="crud-drama-remove-selected-button"
                                            type="button"
                                            onClick={() => handleDeleteDramaEvent(event.id)}
                                            disabled={deletingDramaEventID === event.id}
                                            aria-label={`Xóa sự kiện ${event.title}`}
                                            title="Xóa sự kiện"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </Fragment>
                            ))}
                        </>
                    )}
                    {selectedPosts.length > 0 && (
                        <>
                            {dramaEvent.length > 0 && (
                                <h3 className="crud-drama-title">Bài đăng đang chọn để thêm</h3>
                            )}
                            {selectedPosts.map((post, index) => (
                                <Fragment key={`post-${post.postId ?? post.url ?? index}`}>
                                    <EventVideoTitleSearch
                                        selectedTitle={selectedVideoByItem[`post-${post.postId ?? post.url ?? index}`]}
                                        onSelect={(video) => setSelectedVideoForItem(
                                            `post-${post.postId ?? post.url ?? index}`,
                                            video
                                        )}
                                    />
                                    <div className="crud-drama-selected-post-item">
                                        <ViewPostDrama post={post} embedWidth={420} />
                                        <button
                                            className="crud-drama-remove-selected-button"
                                            type="button"
                                            onClick={() => onRemoveSelectedPost?.(post)}
                                            aria-label="Xóa bài đăng đã chọn"
                                            title="Xóa bài đăng đã chọn"
                                        >
                                            −
                                        </button>
                                    </div>
                                </Fragment>
                            ))}
                        </>
                    )}


                    // Viết  ở đây phần lấy bài post trực tiếp từ link
                    <button
                        className="crud-drama-submit-button"
                        type="button"
                        onClick={() => {
                            const existingEvents = dramaEvent.map((event, index) => {
                                const selectedVideo = selectedVideoByItem[
                                    `event-${event.id ?? event.postId ?? event.link ?? index}`
                                ];
                                return selectedVideo?.id == null
                                    ? event
                                    : { ...event, videoID: selectedVideo.id };
                            });
                            const newPosts = selectedPosts.map((post, index) => {
                                const selectedVideo = selectedVideoByItem[
                                    `post-${post.postId ?? post.url ?? index}`
                                ];
                                return selectedVideo?.id == null
                                    ? post
                                    : { ...post, videoID: selectedVideo.id };
                            });
                            submitDramaEvent([...existingEvents, ...newPosts]);
                        }}
                        disabled={isSubmittingDramaEvent}
                    >
                        Đồng ý lưu các sự kiện
                    </button>
                </section>
            )}
        </div>
    );
}
