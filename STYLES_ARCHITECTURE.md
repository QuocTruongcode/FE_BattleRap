# 📁 Styles Architecture

## Cấu trúc thư mục

```
src/
├── styles/
│   ├── index.css                 # Main entry point - imports tất cả styles
│   ├── global/
│   │   └── base.css             # Reset, typography, global styles
│   ├── utils/
│   │   ├── variables.css        # CSS Custom Properties (Design Tokens)
│   │   └── utilities.css        # Utility classes (margin, padding, text, etc.)
│   └── components/
│       ├── Header.css           # Header component styles
│       ├── Sidebar.css          # Sidebar component styles
│       ├── VideoCard.css        # VideoCard component styles
│       ├── VideoGrid.css        # VideoGrid component styles
│       └── Home.css             # Home page layout styles
├── components/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── VideoCard.jsx
│   └── VideoGrid.jsx
├── pages/
│   └── Home.jsx
├── App.jsx                       # Main App component
├── App.css                       # (Deprecated - keep empty for future use)
├── index.css                     # Re-exports từ styles/index.css
├── main.jsx                      # Entry point
└── ...
```

## Lợi ích của cấu trúc này

### ✅ **Scalability (Khả năng mở rộng)**
- Mỗi component có CSS riêng, dễ thêm component mới
- Không bị CSS conflict khi project lớn
- Dễ refactor từng component độc lập

### ✅ **Maintainability (Dễ bảo trì)**
- Tách biệt global styles vs component styles
- Design tokens (variables) tập trung ở một nơi
- Dễ tìm và thay đổi style một component

### ✅ **Performance (Hiệu năng)**
- CSS được tổ chức theo nhóm logic
- Dễ để code splitting CSS sau này
- Có thể lazy load CSS cho các component không dùng

### ✅ **Design System (Hệ thống thiết kế)**
- Tất cả color, spacing, font, shadows... đều ở `variables.css`
- Khi thay đổi brand color, chỉ cần đổi 1 variable
- Hỗ trợ dark mode dễ dàng qua media query

### ✅ **Team Collaboration (Làm việc nhóm)**
- Rõ ràng file CSS nào của component nào
- Giảm conflict khi merge code
- Dễ code review và maintain

## Cách sử dụng

### 1. **Thêm Design Token mới**
```css
/* src/styles/utils/variables.css */
:root {
  --color-new: #xxxxx;
  --spacing-new: 48px;
}
```

### 2. **Thêm Utility class mới**
```css
/* src/styles/utils/utilities.css */
.new-utility {
  /* styles */
}
```

### 3. **Thêm Component CSS mới**
```css
/* src/styles/components/NewComponent.css */
.new-component {
  /* styles */
}

/* Sau đó import vào styles/index.css */
@import './components/NewComponent.css';
```

### 4. **Sử dụng CSS Variables trong component**
```css
/* Thay vì hardcode color: */
background-color: #065fd4;

/* Dùng variable: */
background-color: var(--color-primary);
```

## Migration Guide (Nếu có file CSS cũ)

### ❌ Cũ (Scattered CSS)
```
src/
├── components/
│   ├── Header.jsx
│   └── Header.css
```

### ✅ Mới (Organized CSS)
```
src/
├── styles/
│   └── components/
│       └── Header.css
├── components/
│   └── Header.jsx
```

## Dark Mode Support

Hiện tại dark mode đã được setup ở variables.css:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f3f4f6;
    --color-bg-primary: #1f2937;
    /* ... */
  }
}
```

Tất cả styles sử dụng variables sẽ tự động thích ứng khi user bật dark mode.

## Production Best Practices

### ✅ Minification
- Vite sẽ tự động minify CSS khi build
- File `.css` sẽ được tối ưu hóa

### ✅ CSS Purging (Future)
- Có thể thêm PurgeCSS để loại bỏ unused CSS
- Dặc biệt khi dùng utility classes

### ✅ CSS Modules (Optional)
- Nếu muốn thêm CSS Modules để tránh naming conflicts:
  ```css
  Header.module.css
  ```

### ✅ SCSS/SASS (Optional)
- Có thể convert sang SCSS để dùng variables, mixins
- Install: `npm install -D sass`

## Performance Tips

1. **Dùng CSS Variables thay hardcode colors**
   - Giảm CSS size (nếu color bị lặp lại)

2. **Tách CSS cho pages khác nhau**
   - Nếu có multiple pages, có thể tách CSS per page

3. **Optimize images & assets**
   - Dùng `object-fit` cho images
   - Lazy load images khi cần

4. **Responsive Design**
   - Breakpoints đã được setup:
     - Mobile: 480px
     - Tablet: 768px
     - Desktop: 1024px, 1100px, 1400px

## Next Steps (Tương lai)

- [ ] Thêm SCSS support
- [ ] Setup CSS-in-JS (Styled Components, Emotion) nếu cần
- [ ] Thêm CSS Modules
- [ ] Setup Storybook để showcase components
- [ ] Thêm Tailwind CSS (nếu thích utility-first)

---

**Tóm tắt:** Cấu trúc này đã **production-ready** ✅ và có thể scale lên dễ dàng khi project phát triển!
