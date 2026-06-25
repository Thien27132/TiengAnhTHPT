const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { email, password, fullName } = req.body;
    try {
        // 1. Kiểm tra Email
        const checkUser = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
        if (checkUser.recordset.length > 0) return res.status(400).json({ message: "Email đã tồn tại!" });

        // 2. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. INSERT vào bảng Users với RoleID = 2 (Student) mặc định
        const result = await sql.query`
            INSERT INTO Users (FullName, Email, Password, RoleID, CreatedAt)
            OUTPUT INSERTED.UserID
            VALUES (${fullName}, ${email}, ${hashedPassword}, 2, GETDATE())
        `;
        
        const newUserId = result.recordset[0].UserID;

        // 4. INSERT vào bảng con Students (vì kế thừa ISA)
        await sql.query`INSERT INTO Students (StudentID) VALUES (${newUserId})`;

        res.status(201).json({ message: "Đăng ký thành công tài khoản học sinh!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi đăng ký", error: err.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // JOIN với bảng Roles để lấy RoleName (Admin/Student)
        const result = await sql.query`
            SELECT u.*, r.RoleName 
            FROM Users u 
            JOIN Roles r ON u.RoleID = r.RoleID 
            WHERE u.Email = ${email}`;
        
        const user = result.recordset[0];

        if (!user) return res.status(404).json({ message: "Email không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai!" });

        // Ném RoleName vào Token để Middleware sau này kiểm tra quyền cực nhanh
        const token = jwt.sign(
            { userId: user.UserID, role: user.RoleName }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({   
            message: "Đăng nhập thành công!", 
            token, 
            user: {
                UserID: user.UserID,
                FullName: user.FullName,
                Email: user.Email,
                role: user.RoleName
            } 
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi đăng nhập", error: err.message });
    }
};

module.exports = { register, login };