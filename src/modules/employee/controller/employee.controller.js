export const getAllEmployees = async (req, res, next) => {
  try {
    // Simulate fetching employees from a database
    const employees = [
      { id: 1, name: "John Doe", position: "Software Engineer" },
      { id: 2, name: "Jane Smith", position: "Project Manager" },
    ];

    res.status(200).json({
      status: "success",
      data: {
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
};
