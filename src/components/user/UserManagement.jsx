import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AllCodeservice, Userservice } from '../../services/api';
import './UserManagement.css';

const USERS_QUERY_KEY = ['users'];
const USER_TYPES_QUERY_KEY = ['user-types'];

function getResponseList(response, resourceName) {
    const list = Array.isArray(response) ? response : response?.data;

    if (!Array.isArray(list)) {
        throw new Error(`Dữ liệu ${resourceName} không hợp lệ.`);
    }

    return list;
}

export default function UserManagement() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        UserName: '',
        Email: '',
        UserType: '',
        google_sub: '',
    });

    const {
        data: users = [],
        isLoading: isLoadingUsers,
        isError: isUsersError,
        error: usersError,
    } = useQuery({
        queryKey: USERS_QUERY_KEY,
        queryFn: async () => getResponseList(await Userservice.getAll(), 'người dùng'),
    });

    const {
        data: userTypes = [],
        isLoading: isLoadingTypes,
        isError: isTypesError,
        error: userTypesError,
    } = useQuery({
        queryKey: USER_TYPES_QUERY_KEY,
        queryFn: async () => getResponseList(await AllCodeservice.getByType('User'), 'chức vụ'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => Userservice.update(id, payload),
        onSuccess: (_, { id, payload }) => {
            const selectedType = userTypes.find((type) => type.KeyMap === payload.UserType);
            queryClient.setQueryData(USERS_QUERY_KEY, (currentUsers = []) =>
                currentUsers.map((user) => (
                    user.id === id
                        ? { ...user, ...payload, Type: selectedType ?? user.Type }
                        : user
                ))
            );
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
            toast.success('Cập nhật người dùng thành công.');
            setEditingId(null);
        },
        onError: (error) => {
            toast.error(`Không thể cập nhật người dùng: ${error.message}`);
        },
    });

    const startEditing = (user) => {
        setEditingId(user.id);
        setFormData({
            UserName: user.UserName ?? '',
            Email: user.Email ?? '',
            UserType: user.UserType ?? '',
            google_sub: user.google_sub ?? '',
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setFormData({ UserName: '', Email: '', UserType: '', google_sub: '' });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = (event, id) => {
        event.preventDefault();
        const payload = {
            UserName: formData.UserName.trim(),
            Email: formData.Email.trim(),
            UserType: formData.UserType,
            google_sub: formData.google_sub,
        };

        if (!payload.UserName || !payload.Email || !payload.UserType) {
            toast.error('Vui lòng nhập đầy đủ thông tin người dùng.');
            return;
        }

        updateMutation.mutate({ id, payload });
    };

    if (isLoadingUsers || isLoadingTypes) {
        return <div className="user-management__status">Đang tải dữ liệu người dùng...</div>;
    }

    if (isUsersError || isTypesError) {
        return (
            <div className="user-management__status user-management__status--error" role="alert">
                Không tải được {isUsersError ? 'danh sách người dùng' : 'danh sách chức vụ'}:{' '}
                {(isUsersError ? usersError : userTypesError)?.message || 'Lỗi API'}
            </div>
        );
    }

    return (
        console.log("Check users: ", users),
        <section className="user-management">
            <header className="user-management__header">
                <div>
                    <p className="user-management__eyebrow">Quản trị</p>
                    <h1>Quản lý người dùng</h1>
                </div>
                <span className="user-management__count">{users.length} người dùng</span>
            </header>

            <div className="user-management__table-wrap">
                <table className="user-management__table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên người dùng</th>
                            <th>Email</th>
                            <th>Chức vụ</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                {editingId === user.id ? (
                                    <td colSpan="5">
                                        <form
                                            className="user-management__edit-form"
                                            onSubmit={(event) => handleSubmit(event, user.id)}
                                        >
                                            <span className="user-management__id">{user.id}</span>
                                            <input
                                                aria-label="Tên người dùng"
                                                name="UserName"
                                                value={formData.UserName}
                                                onChange={handleChange}
                                                required
                                            />
                                            <input
                                                aria-label="Email"
                                                name="Email"
                                                type="text"
                                                inputMode="email"
                                                value={formData.Email}
                                                onChange={handleChange}
                                                required
                                            />
                                            <select
                                                aria-label="Chức vụ"
                                                name="UserType"
                                                value={formData.UserType}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Chọn chức vụ</option>
                                                {userTypes.map((type) => (
                                                    <option key={type.KeyMap} value={type.KeyMap}>
                                                        {type.ValueVi}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="user-management__actions">
                                                <button
                                                    className="user-management__button user-management__button--save"
                                                    type="submit"
                                                    disabled={updateMutation.isPending}
                                                >
                                                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                                <button
                                                    className="user-management__button user-management__button--cancel"
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td>{user.id}</td>
                                        <td>{user.UserName}</td>
                                        <td>{user.Email}</td>
                                        <td>{userTypes.find((type) => type.KeyMap === user.UserType)?.ValueVi ?? user.Type?.ValueVi ?? user.UserType}</td>
                                        <td>
                                            <button
                                                className="user-management__button user-management__button--edit"
                                                type="button"
                                                onClick={() => startEditing(user)}
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td className="user-management__empty" colSpan="5">
                                    Chưa có người dùng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
