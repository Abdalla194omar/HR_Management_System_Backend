# HR_Management_System_Backend

This is the backend part of the Human Resources Management System.  
It provides RESTful APIs for managing employees,department, attendance, Payrolls, holiday, user authentication, and system settings.

## 📚 Tech Stack
- Node.js (Express)
- Database: (MongoDB, MySQL)
- JWT for authentication
- Other libraries you’re using (Mongoose)

---

## 🚀 How to Run Locally
1. Clone the repository:
    - git clone https://github.com/Abdalla194omar/HR_Management_System_Backend.git

2. Navigate to the project folder:
    - cd HR_Management_System_Backend

3. Install dependencies:
    - npm install

4. Create a `.env` file and add your environment variables
    - URL
    - PORT
    - NODE_ENV 
    - FRONTEND_URL


5. Run the server:
    - npm start


> The backend server will run on `http://localhost:<PORT>`

---
## 📂 API Endpoints

- **Auth**
    - POST /api/auth/register
    - POST /api/auth/login

- **Employees**
    - POST /api/employees
    - GET /api/employees/all
    - GET /api/employees/:id
    - GET /api/employees?hireDate=&departmentName=
    - GET /api/employees/search?name=
    - GET /api/employees/total
    - GET /api/employees/all/without-pagination
    - PATCH /api/employees/:id
    - DELETE /api/employees/:id

- **Department**
    - POST /api/departments
    - GET /api/departments
    - PUT /api/departments/:id
    - DELETE /api/departments/:id

- **Attendance**
    - POST /api/attendance
    - POST /api/attendance/checkin
    - GET /api/attendance
    - GET /api/attendance/absence
    - GET /api/attendance/graph
    - PATCH /api/attendance/:id
    - PATCH /api/attendance/checkout/:id
    - DELETE /api/attendance/:id

- **Holiday**
    - POST /api/holidays
    - GET /api/holidays
    - PUT /api/holidays/:id
    - DELETE /api/holidays/:id

- **Payrolls Reports**
    - GET /api/payrolls
    - GET /api/payrolls/employee

- **Chatbot**
    - POST /api/chat

---

## 📝 Features
- User Authentication: Secure login and registration for HR admins using JWT.
- Employee Management: CRUD operations for employee records.
- Department Management: CRUD operations for departments.
- Attendance Tracking: Record check-ins, check-outs, absences, and generate attendance graphs.
- Payroll Reports: Generate payroll reports with employee details and deductions.
- Holiday Management: Manage official holidays with CRUD operations.
- System Settings: Configure deductions, bonuses, and holidays.
- Chatbot Integration: Basic chatbot functionality for HR-related queries .
- Error Handling: Global error middleware for robust API responses.
- Input Validation: Middleware to ensure valid data inputs.

---

## 🤝 Contributing
This is a training project by BinaryBlossoms Team . Contributions are limited to team members. 
To contribute:
- Create a feature branch (git checkout -b feature/your-feature).
- Commit changes (git commit -m "Add your feature").
- Push to the branch (git push origin feature/your-feature).
- Open a Pull Request for review by the ITI BinaryBlossoms team.

---

## 📧 Contact
For project-related inquiries, contact with BinaryBlossoms Team members:
- Abdullh Omar Mahrous Atia : [GitHub](https://github.com/Abdalla194omar) [LinkedIn](https://www.linkedin.com/in/abdalla-omar-mahrous-237844194/)
- Alaa Abdullh Mostafa El-Sayed : [GitHub](https://github.com/Alaa-Abdullh) [LinkedIn](https://www.linkedin.com/in/alaa-abdullh-3b050324b/)
- Yasmin Ayman Abdelhady Zineldin : [GitHub](https://github.com/yasminzin) [LinkedIn](https://www.linkedin.com/in/yasminzineldin/)
- Fatma Ashraf Mohamed Yousif : [GitHub](https://github.com/ffattma) [LinkedIn](https://www.linkedin.com/in/alaa-abdullh-3b050324b/)
- Aya Salah Salem Ali Eltanbadawy : [GitHub](https://github.com/ayasalah600) [LinkedIn](https://www.linkedin.com/in/aya-salah-b372741a9/)

---

## 📜 License

**This project is part of our graduation project at ITI and is intended for academic purposes only. It is not licensed for commercial use or distribution outside the scope of the ITI graduation requirements.**















