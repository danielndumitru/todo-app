# Todo App

A modern and responsive todo list application with PWA support, drag-and-drop functionality, and local storage persistence.

![Todo App Screenshot](screenshots/todo-app.png)

## Features

- ✨ Clean and modern UI with glassmorphism design
- 📱 Fully responsive design that works on all devices
- 💾 Local storage persistence
- 🔄 Drag and drop reordering of tasks
- 🔍 Search and filter functionality
- ⚡ Progressive Web App (PWA) support
- 📝 Task descriptions support
- ✅ Task completion tracking
- 🗑️ Bulk delete functionality
- 🌐 Offline functionality

## Installing as a PWA

1. Open the app in a supported browser (Chrome, Edge, Safari)
2. Look for the "Install" or "Add to Home Screen" option in your browser
3. Follow the prompts to install the app
4. The app will now be available offline and can be launched from your device's home screen

## Usage

### Basic Operations

- Add new todos using the input field at the top
- Click the checkbox to mark a todo as complete
- Use the edit button (pencil icon) to modify a todo
- Click the description button (document icon) to add/edit descriptions
- Use the delete button (trash icon) to remove a todo

### Advanced Features

- **Search**: Use the search bar to filter todos
- **Sort**: Use the dropdown menu to sort by:
  - Newest First
  - Oldest First
  - Alphabetical
- **Drag & Drop**: Reorder todos by dragging them (within their completion status section)
- **Bulk Delete**: Use the "Delete All" button to remove all todos

## Offline Support

The app works fully offline after the first visit:

- All assets are cached using Service Workers
- Tasks are stored in local storage
- Changes made offline will persist
- Full PWA functionality with offline support

## Browser Support

Tested and working on:

- Chrome (desktop & mobile) v90+
- Firefox v90+
- Safari (desktop & mobile) v14+
- Edge v90+
- Opera v76+

## Technical Details

### Technologies

- HTML5
- CSS3 (with modern features like CSS Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Service Workers for PWA functionality
- Local Storage API for data persistence
- Drag and Drop API

### Performance

- Optimized images using WebP format
- Minimal dependencies (no external libraries)
- Efficient DOM manipulation
- Smooth animations and transitions

## Development

### Prerequisites

- A modern web browser
- Basic understanding of HTML, CSS, and JavaScript
- Text editor (VS Code recommended)

### Local Development

1. Clone the repository
2. Make your changes
3. Test in a browser
4. For PWA testing, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- Use meaningful variable and function names
- Comment complex logic
- Follow existing code formatting
- Test changes across different browsers

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License - see the [LICENSE](LICENSE) file for details.

## Author

Daniel Dumitru

## Acknowledgments

- Background image by [Pawel Czerwinski](https://unsplash.com/@pawel_czerwinski) on Unsplash
- Icons from [Material Design Icons](https://material.io/resources/icons/)
- Inspired by modern UI/UX design principles

## Support

If you find any bugs or have feature requests, please open an issue on GitHub.

---

Made by Daniel Dumitru
