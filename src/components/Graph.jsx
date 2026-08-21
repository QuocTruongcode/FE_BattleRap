import { useEffect, useState } from 'react';
import './Graph.css';

export default function Graph({ video, barSelected }) {
    const [entities, setEntities] = useState([]);

    useEffect(() => {
        if (!barSelected?.id) {
            setEntities([]);
        }
    }, [barSelected]);

    const handleAddEntity = () => {
        const nextIndex = entities.length + 1;
        setEntities(prev => [
            ...prev,
            {
                id: `${Date.now()}-${nextIndex}`,
                name: `Entity ${nextIndex}`,
                connectionType: 'relatesTo',
            },
        ]);
    };

    const updateEntity = (id, key, value) => {
        setEntities(prev => prev.map(entity => (
            entity.id === id ? { ...entity, [key]: value } : entity
        )));
    };

    const barText = barSelected?.text || barSelected?.lyric || barSelected?.content || barSelected?.name || 'Nội dung bar chưa có';
    const barTime = barSelected?.time || barSelected?.startTime || barSelected?.start || barSelected?.startTime || '';

    return (
        <div className="graph-container">
            <div className="graph-header">
                <h2>{video?.title || 'Biểu đồ tri thức từng bar'}</h2>
            </div>
            <div className="graph-body">
                {!barSelected?.id ? (
                    <div className="graph-empty">
                        <p>Chọn một bar từ Lyric Panel để tạo sơ đồ kết nối.</p>
                        <p>Bar được chọn sẽ xuất hiện bên trên, sau đó nhấn + để thêm bảng entity.</p>
                    </div>
                ) : (
                    <div className="graph-diagram">
                        <div className="bar-node">
                            <div className="bar-node-label">Bar đang chọn</div>
                            <div className="bar-node-title">{barSelected?.title || `Bar #${barSelected?.index ?? barSelected?.barIndex ?? ''}`}</div>
                            <div className="bar-node-content">
                                <p>{barText}</p>
                                {barTime && <span className="bar-node-meta">Thời gian: {barTime}</span>}
                            </div>
                        </div>

                        <div className="entities-section">
                            {entities.map(entity => (
                                <div key={entity.id} className="entity-row">
                                    <div className="entity-connector">
                                        <span className="connector-label">{entity.connectionType}</span>
                                        <span className="connector-line" />
                                    </div>
                                    <div className="entity-card">
                                        <div className="entity-card-header">Bảng entity</div>
                                        <div className="entity-card-body">
                                            <label>
                                                Tên bảng
                                                <input
                                                    type="text"
                                                    value={entity.name}
                                                    onChange={e => updateEntity(entity.id, 'name', e.target.value)}
                                                    placeholder="Entity name"
                                                />
                                            </label>
                                            <label>
                                                Loại kết nối
                                                <input
                                                    type="text"
                                                    value={entity.connectionType}
                                                    onChange={e => updateEntity(entity.id, 'connectionType', e.target.value)}
                                                    placeholder="e.g. relatesTo"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="add-entity-button" type="button" onClick={handleAddEntity}>
                                + Thêm bảng entity
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
