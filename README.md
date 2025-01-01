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
  - Automatic updates with version management
  - Offline functionality
  - Install prompts for mobile devices
  - Push notifications support
- 📝 Task descriptions support
- ✅ Task completion tracking
- 🗑️ Bulk delete functionality
- 📋 Multiple todo lists support
- 🔄 Auto-sync between tabs
- 🎯 Smart install prompts
- 🔔 Update notifications

## Version Management

The app includes a robust version management system that:

- Displays current version in the top-left corner
- Automatically checks for updates
- Prompts users when updates are available
- Handles cache updates seamlessly
- Provides fallback for offline usage

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
- **Drag & Drop**: Reorder todos (within their completion status section)
- **Bulk Delete**: Use the "Delete All" button to remove all todos
- **Multiple Lists**: Create and manage multiple todo lists
- **Auto Updates**: Receive notifications when updates are available

## Offline Support

The app works fully offline after the first visit:

- All assets are cached using Service Workers
- Tasks are stored in local storage
- Changes made offline will persist
- Automatic sync when back online

## Technical Details

### Technologies

- HTML5
- CSS3 (with modern features like CSS Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Service Workers for PWA functionality
- Local Storage API for data persistence
- Drag and Drop API

### Version Control

The app implements a sophisticated version control system:

- Version tracking through version.json
- Automatic cache invalidation
- Smart update prompts
- Graceful degradation
- Forced cache updates when necessary

### Performance

- Optimized images using WebP format
- Minimal dependencies (no external libraries)
- Efficient DOM manipulation
- Smooth animations and transitions
- Smart caching strategies

## Development

### Prerequisites

- A modern web browser
- Basic understanding of HTML, CSS, and JavaScript
- Text editor (VS Code recommended)

### Local Development

1. Clone the repository
2. Make your changes
3. Update version.json when making changes
4. Test in a browser
5. For PWA testing, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

### Version Update Process

When updating the app:

1. Increment version number in version.json
2. Update releaseNotes if necessary
3. Test update functionality
4. Deploy changes
5. Verify cache invalidation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Update version.json with new version number
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

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
