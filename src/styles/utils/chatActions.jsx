// src/utils/chatActions.js
const routes = {
    home: () => "/",
    login: () => "/login",
    chatbot: () => "/chatbot",
    watch: ({ videoId }) => `/watch/${videoId}`,

    // các trang admin (ProtectedRoute U0)
    videoCrud: () => "/crud",
    editBar: ({ videoId }) => `/edit/${videoId}`,
    knowledgeGraph: () => "/knowledgeGraph",
    battlerCrud: () => "/CRUDbattler",
    dramaCrud: () => "/CRUDdrama",
}

const actionHandlers = {
    NAVIGATE: ({ target, params }, { navigate }) => {
        const build = routes[target]
        if (!build) return                       // target lạ thì bỏ qua
        navigate(build(params ?? {}))
    },
    // sau này thêm OPEN_MODAL, ... ở đây
}

export const handleAction = (action, ctx) => {
    if (!action) return
    actionHandlers[action.type]?.(action, ctx)
}