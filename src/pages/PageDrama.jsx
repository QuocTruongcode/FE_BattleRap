import { useState } from 'react';
import { MainLayout } from '../components/layout';
import { CRUDDrama, ViewPostDrama } from '../components/ScapePost';
import './PageDrama.css';

export default function PageDrama() {
    const [posts, setPosts] = useState([]);

    return (
        console.log('PageDrama render', posts),
        <div className="page-drama">
            <MainLayout>
                <div className="page-drama__content">
                    <header className="page-drama__header">
                        <h1 className="page-drama__title">Quản lý bài đăng</h1>
                        <p className="page-drama__description">
                            Cấu hình nguồn và thời gian lọc bài đăng, sau đó xem nội dung ở bên cạnh.
                        </p>
                    </header>

                    <div className="page-drama__workspace">
                        <div className="page-drama__settings">
                            <CRUDDrama onSubmit={setPosts} />
                        </div>

                        <section className="page-drama__preview" aria-labelledby="page-drama-preview-title">
                            <h2 id="page-drama-preview-title" className="page-drama__section-title">
                                Xem trước bài đăng
                            </h2>
                            <div className="page-drama__post-scroll">
                                {posts.length > 0 ? posts.map((post, index) => (
                                    <ViewPostDrama
                                        key={post.postId || post.url || index}
                                        post={post}
                                    />
                                )) : (
                                    <ViewPostDrama />
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </MainLayout>
        </div>
    );
}
