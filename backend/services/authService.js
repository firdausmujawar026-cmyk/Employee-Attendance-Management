const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_attendance_enterprise_jwt_key_2025_prod_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Authenticate admin user
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    let user = null;

    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT * FROM Users WHERE Username = ?', [username.trim()]);
      user = rows[0];
    } else {
      const store = db.getMemoryStore();
      user = store.users.find((u) => u.Username.toLowerCase() === username.trim().toLowerCase());
    }

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password.');
    }

    const payload = {
      userId: user.UserID,
      username: user.Username,
      role: user.Role || 'admin',
      fullName: user.FullName,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        userId: user.UserID,
        username: user.Username,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
      },
    };
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId) {
    let user = null;

    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT UserID, Username, FullName, Email, Role FROM Users WHERE UserID = ?', [userId]);
      user = rows[0];
    } else {
      const store = db.getMemoryStore();
      const u = store.users.find((x) => x.UserID === parseInt(userId, 10));
      if (u) {
        user = {
          UserID: u.UserID,
          Username: u.Username,
          FullName: u.FullName,
          Email: u.Email,
          Role: u.Role,
        };
      }
    }

    return user;
  }
}

module.exports = new AuthService();
