// utils/navigation.js
let navigator;

export const setNavigator = (nav) => {
    navigator = nav;
};

export const redirectToLogin = () => {
    if (navigator) {
        navigator('/login', { replace: true });
    } else {
        window.location.href = '/login';
    }
};