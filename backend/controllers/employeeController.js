const employeeService = require('../services/employeeService');

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const { page, limit, search, department, status } = req.query;
      const result = await employeeService.getEmployees({ page, limit, search, department, status });
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await employeeService.getDepartments();
      res.json({
        success: true,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found.',
        });
      }
      res.json({
        success: true,
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const newEmployee = await employeeService.createEmployee(req.body);
      res.status(201).json({
        success: true,
        message: 'Employee created successfully.',
        data: newEmployee,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await employeeService.updateEmployee(id, req.body);
      res.json({
        success: true,
        message: 'Employee updated successfully.',
        data: updated,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async setEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await employeeService.setEmployeeStatus(id, isActive);
      res.json({
        success: true,
        message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const result = await employeeService.deleteEmployee(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new EmployeeController();
