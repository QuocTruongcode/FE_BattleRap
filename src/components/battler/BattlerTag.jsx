import './BattlerTag.css';

const defaultImage =
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80';

export default function BattlerTag({
    image = defaultImage,
    alt = 'Battler avatar',
    type = 'Battler',
    title = 'Rap name',
    artist = 'Full name',
    meta = 'Battler profile',
    description = '',
    artistAvatar,
    className = '',
    children,
    onClick,
    onRemove,
    showRemoveButton = false,
    ...props
}) {
    const profileImage = artistAvatar || image || defaultImage;

    const handleRemoveClick = (event) => {
        event.stopPropagation();
        onRemove?.();
    };

    return (
        <article
            className={`battler-tag ${className}`.trim()}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            {...props}
        >
            {showRemoveButton && (
                <button
                    type="button"
                    className="battler-tag__remove"
                    onClick={handleRemoveClick}
                    aria-label={`Xóa ${title}`}
                >
                    ×
                </button>
            )}

            <div className="battler-tag__cover-wrap">
                <img src={image || defaultImage} alt={alt} className="battler-tag__cover" />
            </div>

            <div className="battler-tag__content">
                <span className="battler-tag__type">{type}</span>
                <h2 className="battler-tag__title">{title}</h2>

                <div className="battler-tag__artist-row">
                    <img
                        src={profileImage}
                        alt={artist}
                        className="battler-tag__artist-avatar"
                    />
                    <div className="battler-tag__artist-info">
                        <span className="battler-tag__artist-name">{artist}</span>
                        {meta && <span className="battler-tag__meta">{meta}</span>}
                    </div>
                </div>

                {description && <p className="battler-tag__description">{description}</p>}

                {children && <div className="battler-tag__footer">{children}</div>}
            </div>
        </article>
    );
}
