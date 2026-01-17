# Gmail Clone - Frontend

A modern, responsive Gmail-like email client built with React that connects to your custom email server.

## Features

- 🔐 **User Authentication** - Register and login with secure JWT tokens
- 📧 **Email Management** - View inbox, sent, drafts, and failed emails
- ✍️ **Rich Text Composer** - Full-featured email composer with HTML support
- 🔄 **Real-time Updates** - Auto-refresh emails every 30 seconds
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Gmail-like UI** - Familiar interface with modern design
- ⚡ **Fast Performance** - Optimized React components and API calls

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Quill** - Rich text editor for email composition
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Your backend server running at `https://mailing.kunalpatil.me`

### Installation

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   └── Dashboard/
│   │       ├── Dashboard.js
│   │       ├── Header.js
│   │       ├── Sidebar.js
│   │       ├── EmailList.js
│   │       ├── EmailView.js
│   │       └── ComposeEmail.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── EmailContext.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## API Integration

The frontend connects to your backend API at `https://mailing.kunalpatil.me/api` with the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Email Management
- `GET /api/mails` - Get user's emails
- `GET /api/mails/:id` - Get specific email
- `POST /api/mails` - Create new email/draft
- `POST /api/mails/:id/send` - Send email

## Features Overview

### 🔐 Authentication System
- Secure user registration and login
- JWT token-based authentication
- Automatic token refresh and logout on expiry
- Protected routes for authenticated users

### 📧 Email Management
- **Inbox** - View received emails
- **Sent** - View sent emails
- **Drafts** - View and edit draft emails
- **Failed** - View failed email deliveries
- Real-time email status updates

### ✍️ Email Composer
- Rich text editor with formatting options
- HTML and plain text support
- Draft saving functionality
- Attachment support (UI ready)
- Cc/Bcc recipients
- Reply and forward functionality

### 🎨 User Interface
- Gmail-inspired design
- Responsive layout for all devices
- Dark/light theme support (configurable)
- Smooth animations and transitions
- Loading states and error handling

## Configuration

### Environment Variables

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=https://mailing.kunalpatil.me/api
REACT_APP_REFRESH_INTERVAL=30000
```

### Customization

#### Colors
Edit `tailwind.config.js` to customize the Gmail color scheme:

```javascript
colors: {
  gmail: {
    red: '#ea4335',
    blue: '#4285f4',
    green: '#34a853',
    yellow: '#fbbc04',
  }
}
```

#### API Endpoint
Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

## Usage Guide

### 1. User Registration
- Navigate to `/register`
- Fill in name, email, and password
- Click "Create Account"
- Redirected to login page on success

### 2. User Login
- Navigate to `/login`
- Enter email and password
- Click "Sign In"
- Redirected to dashboard on success

### 3. Email Management
- **View Emails**: Click on sidebar items (Inbox, Sent, etc.)
- **Read Email**: Click on any email in the list
- **Compose Email**: Click the "Compose" button
- **Reply**: Click "Reply" button in email view
- **Refresh**: Click refresh icon in header

### 4. Composing Emails
- Click "Compose" button in sidebar
- Fill in recipient, subject, and message
- Use rich text editor for formatting
- Click "Send" to send or "Save Draft" to save
- Support for Cc/Bcc recipients

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend server is running
   - Check API URL in configuration
   - Ensure CORS is properly configured on backend

2. **Authentication Issues**
   - Clear browser localStorage
   - Check token expiration
   - Verify JWT secret matches backend

3. **Email Not Loading**
   - Check network connectivity
   - Verify user has proper permissions
   - Check browser console for errors

### Development Tips

1. **Hot Reload**: Changes automatically reload in development
2. **Console Logging**: Check browser console for API responses
3. **Network Tab**: Monitor API calls in browser dev tools
4. **React DevTools**: Install React DevTools extension for debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console errors
- Verify backend API is accessible
- Check network connectivity

---

**Happy Emailing! 📧**