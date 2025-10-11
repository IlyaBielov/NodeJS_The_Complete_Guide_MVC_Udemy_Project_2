# Node.js Complete Guide - Social Network Application

A full-stack social media platform built with Node.js, Express, React, and MongoDB. This project demonstrates a complete MVC (Model-View-Controller) architecture with modern web development practices.

## 🚀 Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Post Management**: Create, read, update, and delete posts
- **Image Upload**: Upload and display images with posts
- **Feed System**: Browse and interact with posts from all users
- **User Profiles**: Individual user profiles and management
- **Real-time Validation**: Client and server-side form validation
- **Responsive Design**: Mobile-friendly React frontend

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Express Validator** - Input validation and sanitization

### Frontend
- **React** (v16.5.2) - User interface library
- **React Router DOM** - Client-side routing
- **React Scripts** - Build tools and development server

## 📁 Project Structure

```
NodeJS_The_Complete_Guide_MVC_Udemy_Project_2/
├── backend/
│   ├── controllers/     # Route controllers (business logic)
│   ├── models/         # MongoDB data models
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Custom middleware functions
│   ├── validators/     # Input validation schemas
│   ├── utils/          # Utility functions
│   ├── images/         # Uploaded images storage
│   ├── app.js          # Main application entry point
│   ├── package.json    # Backend dependencies
│   └── .env.example    # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── pages/      # React page components
│   │   └── ...         # Other React components
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
└── README.md           # This file
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/IlyaBielov/NodeJS_The_Complete_Guide_MVC_Udemy_Project_2.git
   cd NodeJS_The_Complete_Guide_MVC_Udemy_Project_2/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/your-database-name
   JWT_SECRET=your-secret-key
   PORT=8080
   ```

4. **Start the backend server**
   ```bash
   npm run start-api
   ```
   The API server will run on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run start-fe
   ```
   The React app will run on `http://localhost:3000`

## 🚀 Usage

1. **Start MongoDB** (if running locally)
2. **Start the backend server** from the `/backend` directory:
   ```bash
   npm run start-api
   ```
3. **Start the frontend server** from the `/frontend` directory:
   ```bash
   npm run start-fe
   ```
4. **Access the application** at `http://localhost:3000`

## 📱 API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Feed Routes (`/feed`)
- `GET /feed/posts` - Get all posts
- `POST /feed/post` - Create new post
- `GET /feed/post/:postId` - Get single post
- `PUT /feed/post/:postId` - Update post
- `DELETE /feed/post/:postId` - Delete post

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Input validation and sanitization
- CORS configuration
- File upload filtering (images only)

## 🧪 Testing

Backend tests can be run using:
```bash
cd backend
npm test
```

## 📝 Development Notes

- The backend uses nodemon for auto-restart during development
- Images are stored locally in the `/backend/images` directory
- CORS is configured to allow frontend-backend communication
- Environment variables are used for sensitive configuration

## 👨‍💻 Author

**Ilya Bielov**
- GitHub: [@IlyaBielov](https://github.com/IlyaBielov)

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

This is a learning project from a Udemy course. Feel free to fork and experiment with the code for educational purposes.

---

*This project is part of "Node.js - The Complete Guide" course and demonstrates full-stack web development with the MVC pattern.*
