import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './BattlerForm.css';
import { battlerService } from '../../services/api';
import { EditReview } from '../review';
import BattlerTag from './BattlerTag';

const initialForm = {
    FullName: '',
    RapName: '',
    image: '',
    Describe: '',
};

export default function BattlerForm() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const {
        data: battlers = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['battlers'],
        queryFn: async () => {
            const res = await battlerService.getAll();
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            return list;
        },
        staleTime: Infinity,
    });

    const createMutation = useMutation({
        mutationFn: (payload) => battlerService.create(payload),
        onSuccess: (response) => {
            const createdBattler = response?.data ?? response ?? null;
            queryClient.setQueryData(['battlers'], (old = []) =>
                createdBattler ? [createdBattler, ...old] : old
            );
            queryClient.invalidateQueries({ queryKey: ['battlers'] });
            alert('Thêm battler thành công!');
        },
        onError: () => alert('Thêm battler không thành công!'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formValue }) => battlerService.update(id, formValue),
        onSuccess: (_, { id, formValue }) => {
            queryClient.setQueryData(['battlers'], (old = []) =>
                old.map((item) => (item.id === id ? { ...item, ...formValue } : item))
            );
            alert('Sửa battler thành công!');
        },
        onError: () => alert('Sửa battler không thành công!'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => battlerService.remove(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['battlers'], (old = []) =>
                old.filter((item) => item.id !== id)
            );
            alert('Xoá battler thành công!');
        },
        onError: () => alert('Xoá battler không thành công!'),
    });

    const hasAnyField = useMemo(
        () => Object.values(formData).some((value) => value.trim() !== ''),
        [formData]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const FullName = formData.FullName.trim();
        const RapName = formData.RapName.trim();
        const image = formData.image.trim();
        const Describe = formData.Describe.trim();

        if (!FullName || !RapName || !image || !Describe) {
            return;
        }

        const payload = { FullName, RapName, image, Describe };

        if (editingId) {
            updateMutation.mutate({ id: editingId, formValue: payload });
            setEditingId(null);
        } else {
            createMutation.mutate(payload);
        }

        setFormData(initialForm);
    };

    const handleEdit = (battler) => {
        setEditingId(battler.id);
        setFormData({
            FullName: battler.FullName ?? '',
            RapName: battler.RapName ?? '',
            image: battler.image ?? '',
            Describe: battler.Describe ?? '',
        });
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
        if (editingId === id) {
            setEditingId(null);
            setFormData(initialForm);
        }
    };

    const handleReset = () => {
        setFormData(initialForm);
        setEditingId(null);
    };

    if (isLoading) return <div>Loading battlers...</div>;
    if (isError) return <div>Không tải được battler: {error?.message || 'Lỗi API'}</div>;

    return (
        <div className="battler-form-wrapper">
            <form className="battler-form" onSubmit={handleSubmit}>
                <div className="battler-form__header">
                    <div>
                        <p className="battler-form__label">Battler form</p>
                        <h3>{editingId ? 'Update battler' : 'Add battler'}</h3>
                    </div>
                    {editingId && (
                        <button type="button" className="battler-form__cancel" onClick={handleReset}>
                            Cancel
                        </button>
                    )}
                </div>

                <label className="battler-form__field">
                    <span>Full name</span>
                    <input
                        type="text"
                        name="FullName"
                        value={formData.FullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                    />
                </label>

                <label className="battler-form__field">
                    <span>Rap name</span>
                    <input
                        type="text"
                        name="RapName"
                        value={formData.RapName}
                        onChange={handleChange}
                        placeholder="Enter rap name"
                    />
                </label>

                <label className="battler-form__field">
                    <span>Link image</span>
                    <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="https://..."
                    />
                </label>

                <label className="battler-form__field">
                    <span>Describe</span>
                    <EditReview
                        key={editingId ?? 'new-battler'}
                        markdown={formData.Describe}
                        onChange={(value) =>
                            setFormData((current) => ({
                                ...current,
                                Describe: value,
                            }))
                        }
                    />
                </label>

                <div className="battler-form__actions">
                    <button type="submit" className="battler-form__button battler-form__button--primary">
                        {editingId ? 'Save changes' : 'Add'}
                    </button>
                    {hasAnyField && (
                        <button type="button" className="battler-form__button battler-form__button--secondary" onClick={handleReset}>
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div className="battler-list">
                {battlers.map((battler) => (
                    <div key={battler.id} className="battler-list__item">
                        <BattlerTag
                            image={battler.image}
                            alt={battler.FullName}
                            type="Battler"
                            title={battler.RapName || 'Unnamed battler'}
                            artist={battler.FullName || 'Unknown name'}
                            meta="Battler profile"
                            description={battler.Describe || 'Chưa có mô tả'}
                            className="battler-tag--compact"
                        >
                            <div className="battler-tag__actions">
                                <button type="button" className="mini-button mini-button--edit" onClick={() => handleEdit(battler)}>
                                    Sửa
                                </button>
                                <button type="button" className="mini-button mini-button--delete" onClick={() => handleDelete(battler.id)}>
                                    Xoá
                                </button>
                            </div>
                        </BattlerTag>
                    </div>
                ))}
            </div>
        </div>
    );
}
