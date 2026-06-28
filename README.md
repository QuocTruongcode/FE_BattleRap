# WebbattelRap - YouTube-like Home Page

A production-ready YouTube-clone frontend built with React + Vite featuring a modern, scalable component architecture.

## 🎯 Features

✅ **YouTube-like Layout**
- Header with logo, search bar, and action buttons
- Sidebar with navigation menu
- Video grid with responsive design
- Real-time video search/filtering

✅ **Professional Architecture**
- Component-based structure
- Centralized style management (CSS-in-folder)
- CSS variables for design tokens
- Utility classes for common patterns

✅ **Responsive Design**
- Desktop: Full layout with sidebar
- Tablet: Optimized spacing
- Mobile: Collapsible sidebar, single column

✅ **Performance Optimized**
- Fast HMR (Hot Module Replacement)
- Lazy loading ready
- CSS organized by component

## 📁 Project Structure

```
src/
├── styles/                          # Centralized styles
│   ├── index.css                   # Main entry point
│   ├── global/
│   │   └── base.css               # Global reset & typography
│   ├── utils/
│   │   ├── variables.css          # Design tokens (colors, spacing, etc.)
│   │   └── utilities.css          # Utility classes
│   └── components/
│       ├── Header.css
│       ├── Sidebar.css
│       ├── VideoCard.css
│       ├── VideoGrid.css
│       └── Home.css
├── components/                      # Reusable components
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── VideoCard.jsx
│   └── VideoGrid.jsx
├── pages/                           # Page components
│   └── Home.jsx
├── App.jsx
├── main.jsx
└── index.css                        # Entry CSS
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Run development server**
```bash
npm run dev
```

3. **Open in browser**
Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📚 Components Guide

### Header Component
Search bar, logo, and action buttons. Sticky position at top.
- Search functionality with real-time filtering
- Icon buttons for Upload, Notifications, Profile

### Sidebar Component
Navigation menu with channels list
- Active state styling
- Responsive collapse on mobile

### VideoCard Component
Individual video preview card
- Thumbnail with duration
- Channel avatar
- View count & upload date formatting
- Hover effects

### VideoGrid Component
Grid layout for videos
- Auto-responsive columns
- Search filtering
- Empty state handling

## 🎨 Design System

All colors, spacing, and typography are defined as CSS variables in `src/styles/utils/variables.css`:

```css
--color-primary: #065fd4
--color-accent: #ff0000
--spacing-16: 16px
--font-size-base: 14px
/* ... more tokens */
```

See [STYLES_ARCHITECTURE.md](./STYLES_ARCHITECTURE.md) for detailed style documentation.

## 📱 Responsive Breakpoints

- **Mobile**: 480px and below
- **Tablet**: 768px
- **Desktop**: 1024px+
- **Large Desktop**: 1400px+

## 🔧 Configuration

- **Vite Config**: [vite.config.js](./vite.config.js)
- **ESLint Config**: [eslint.config.js](./eslint.config.js)

## 🚧 Future Enhancements

- [ ] Add routing (React Router)
- [ ] Implement video detail page
- [ ] Add authentication
- [ ] Connect to real API
- [ ] Dark mode toggle
- [ ] Video upload functionality
- [ ] Comments section
- [ ] User subscriptions

## 📖 Additional Documentation

- [Styles Architecture](./STYLES_ARCHITECTURE.md) - Detailed guide on CSS organization
- [React + Vite docs](https://vitejs.dev/guide/)

## 📄 License

MIT

---

**Happy coding! 🎉**
