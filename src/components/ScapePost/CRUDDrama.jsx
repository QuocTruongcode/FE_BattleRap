import { useState } from 'react';
import './CRUDDrama.css';
import { FacebookPosts } from '../../services/api';
const DEFAULT_VALUE = {
    links: ['https://www.facebook.com/grabfanthang9'],
    onlyPostsNewerThan: '2026-10-04',
    onlyPostsOlderThan: '2026-10-05',
};

function getInitialValue(initialValue) {
    return {
        links: Array.isArray(initialValue?.links)
            ? [...initialValue.links]
            : [...DEFAULT_VALUE.links],
        onlyPostsNewerThan: initialValue?.onlyPostsNewerThan ?? DEFAULT_VALUE.onlyPostsNewerThan,
        onlyPostsOlderThan: initialValue?.onlyPostsOlderThan ?? DEFAULT_VALUE.onlyPostsOlderThan,
    };
}

export default function CRUDDrama({ initialValue, onChange, onSubmit }) {
    const [formValue, setFormValue] = useState(() => getInitialValue(initialValue));

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

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const posts = await FacebookPosts.scrapeFacebookPosts(formValue);
            if (!Array.isArray(posts?.data)) {
                throw new Error('Dữ liệu bài đăng trả về không hợp lệ.');
            }
            onSubmit?.(posts.data);
        } catch (e) {
            console.error('Failed to scrape Facebook posts:', e);
            alert('Lấy bài đăng thất bại.');
        }
    };

    return (
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

            <button className="crud-drama-submit-button" type="submit">
                Đồng ý
            </button>
        </form>
    );
}
