import FacebookPostEmbed from './FacebookPostEmbed';
import './ViewPostDrama.css';

export default function ViewPostDrama({ post, embedWidth }) {
    if (!post) {
        return (
            <div className="view-post-drama-empty" role="status">
                Chưa có bài đăng để hiển thị.
            </div>
        );
    }

    return <FacebookPostEmbed href={post.url} width={embedWidth} />;
}
