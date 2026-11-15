const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
}

module.exports = new AuthController();
