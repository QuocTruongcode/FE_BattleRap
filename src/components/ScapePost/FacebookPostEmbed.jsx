import { useEffect, useRef, useState } from 'react';
import './FacebookPostEmbed.css';

const FACEBOOK_SDK_URL = 'https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v23.0';

let facebookSdkPromise;

function loadFacebookSdk() {
    if (window.FB?.XFBML) return Promise.resolve();
    if (facebookSdkPromise) return facebookSdkPromise;

    facebookSdkPromise = new Promise((resolve, reject) => {
        let script = document.getElementById('facebook-jssdk');

        window.fbAsyncInit = () => {
            if (window.FB?.XFBML) {
                resolve();
            } else {
                reject(new Error('Facebook SDK chưa khởi tạo được XFBML.'));
            }
        };

        if (!document.getElementById('fb-root')) {
            const root = document.createElement('div');
            root.id = 'fb-root';
            document.body.prepend(root);
        }

        if (script) {
            script.addEventListener('load', () => {
                if (window.FB?.XFBML) resolve();
            }, { once: true });
            script.addEventListener('error', () => reject(new Error('Không thể tải Facebook SDK.')), {
                once: true,
            });
            return;
        }

        script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = FACEBOOK_SDK_URL;
        script.onerror = () => reject(new Error('Không thể tải Facebook SDK.'));
        document.body.appendChild(script);
    }).catch((error) => {
        facebookSdkPromise = undefined;
        throw error;
    });

    return facebookSdkPromise;
}

export default function FacebookPostEmbed({ href }) {
    const embedRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        if (!href) return () => {
            cancelled = true;
        };

        loadFacebookSdk()
            .then(() => {
                if (!cancelled && embedRef.current) {
                    window.FB.XFBML.parse(embedRef.current);
                }
            })
            .catch((sdkError) => {
                if (!cancelled) {
                    console.error('Facebook post embed failed:', sdkError);
                    setError({
                        href,
                        message: 'Không tải được Facebook SDK. Bạn có thể mở bài viết bằng link bên dưới.',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [href]);

    return (
        <div className="facebook-post-embed">
            {href ? (
                <div ref={embedRef} className="facebook-post-embed-frame">
                    <div className="fb-post" data-href={href} data-width="500" />
                </div>
            ) : (
                <p role="status">Chưa có link bài viết để nhúng.</p>
            )}
            {error?.href === href && (
                <p className="facebook-post-embed-error" role="status">{error.message}</p>
            )}
            {href && (
                <a href={href} target="_blank" rel="noreferrer">
                    Mở bài viết trên Facebook
                </a>
            )}
        </div>
    );
}
