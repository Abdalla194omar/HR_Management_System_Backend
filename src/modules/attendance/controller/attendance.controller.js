import Attendance from "../../../../DB/model/Attendence.js";
import AppError from "../../../utils/AppError.js";
import asyncHandler from "../../../utils/asyncHandeler.js";
import Employee from "../../../../DB/model/Employee.js";
import * as calc from "../../../utils/AttendanceCalc.js";

// GET AND FILTER ATTENDANCE (filtering with |name, dept, from, to|)
export const getAttendance = asyncHandler(async (req, res, next) => {
  const { name, department, from, to, page = 1, limit = 10 } = req.query;
  const employeeQuery = [
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employeeData",
      },
    },
    { $unwind: { path: "$employeeData", preserveNullAndEmptyArrays: true } },
  ];
  const query = [{ $match: { isDeleted: false } }, ...employeeQuery];
  const dateFilter = {};
  let attendances = [];

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  if (name) {
    query.push({
      $match: {
        $expr: {
          $regexMatch: {
            input: {
              $concat: ["$employeeData.firstName", " ", "$employeeData.lastName"],
            },
            regex: new RegExp(name, "i"),
          },
        },
      },
    });
  }
  if (department) {
    query.push(
      {
        $lookup: {
          from: "departments",
          localField: "employeeData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      {
        $unwind: { path: "$departmentData", preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          "departmentData.departmentName": {
            $regex: new RegExp(department, "i"),
          },
        },
      }
    );
  }

  if (from && to) {
    const fromUtcDate = new Date(from);
    const toUtcDate = new Date(to);
    fromUtcDate.setUTCHours(0, 0, 0, 0);
    toUtcDate.setUTCHours(0, 0, 0, 0);
    if (fromUtcDate > toUtcDate) return next(new AppError("'from' date can't be after 'to' date", 400));
  }
  if (from) {
    const fromUtcDate = new Date(from);
    fromUtcDate.setUTCHours(0, 0, 0, 0);
    dateFilter.$gte = fromUtcDate;
  }
  if (to) {
    const toUtcDate = new Date(to);
    toUtcDate.setUTCHours(0, 0, 0, 0);
    dateFilter.$lte = toUtcDate;
  }
  if (Object.keys(dateFilter).length > 0) query.push({ $match: { date: dateFilter } });

  const countQuery = [...query];
  countQuery.push({ $count: "total" });
  const totalResult = await Attendance.aggregate(countQuery);
  const totalDocs = totalResult[0]?.total || 0;
  const totalPages = Math.ceil(totalDocs / limitNum);

  query.push(
    {
      $sort: {
        date: -1,
      },
    },
    { $skip: skip },
    { $limit: limitNum }
  );

  const attendanceIds = await Attendance.aggregate([...query, { $project: { _id: 1 } }]);
  attendances = await Attendance.find({ _id: { $in: attendanceIds } })
    .sort({ date: -1 })
    .populate({
      path: "employee",
      populate: {
        path: "department",
        select: "departmentName",
      },
    });

  return res.status(200).json({
    message: "Getting attendances successfully",
    pagination: { totalDocs, totalPages, page: pageNum, limit: limitNum },
    data: attendances,
    queryParams: req.query,
  });
});

// Get Today's Absence
export const getTodayAbsence = asyncHandler(async (req, res, next) => {
  const todayDate = new Date();
  const todayUtcDate = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate()));
  const tomorrowUtcDate = new Date(todayUtcDate);
  tomorrowUtcDate.setUTCDate(tomorrowUtcDate.getUTCDate() + 1);
  const [absenceToday, attendanceToday] = await Promise.all([
    Attendance.find({
      status: "Absent",
      date: { $gte: todayUtcDate, $lt: tomorrowUtcDate },
    }).populate({
      path: "employee",
      select: "firstName lastName",
      populate: {
        path: "department",
        select: "departmentName",
      },
    }),
    Attendance.countDocuments({
      date: { $gte: todayUtcDate, $lt: tomorrowUtcDate },
    }),
  ]);
  return res.status(200).json({
    data: absenceToday,
    totalDocs: absenceToday.length,
    absencePercentage: attendanceToday === 0 ? 0 : Math.round((absenceToday.length / attendanceToday) * 100),
  });
});

// Get Attendance Graph
export const getAttendanceGraph = asyncHandler(async (req, res, next) => {
  const [t1From, t1To, t2From, t2To, t3From, t3To] = [1, 10, 11, 20, 21, 31];
  const now = new Date();
  const targetMonth = now.getUTCMonth() + 1;
  const targetYear = now.getUTCFullYear();

  function tQuery(from, to) {
    return {
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth] },
          { $gte: [{ $dayOfMonth: "$date" }, from] },
          { $lte: [{ $dayOfMonth: "$date" }, to] },
        ],
      },
    };
  }

  const [allT1Attendance, presentT1Attendance, allT2Attendance, presentT2Attendance, allT3Attendance, presentT3Attendance] = await Promise.all([
    Attendance.countDocuments({ isDeleted: false, ...tQuery(t1From, t1To) }),
    Attendance.countDocuments({ isDeleted: false, status: "Present", ...tQuery(t1From, t1To) }),
    Attendance.countDocuments({ isDeleted: false, ...tQuery(t2From, t2To) }),
    Attendance.countDocuments({ isDeleted: false, status: "Present", ...tQuery(t2From, t2To) }),
    Attendance.countDocuments({ isDeleted: false, ...tQuery(t3From, t3To) }),
    Attendance.countDocuments({ isDeleted: false, status: "Present", ...tQuery(t3From, t3To) }),
  ]);

  return res.status(200).json({
    targetMonth,
    allT1Attendance,
    presentT1Attendance,
    allT2Attendance,
    presentT2Attendance,
    allT3Attendance,
    presentT3Attendance,
    presentT1Percent: allT1Attendance === 0 ? 0 : ((presentT1Attendance / allT1Attendance) * 100).toFixed(1),
    presentT2Percent: allT2Attendance === 0 ? 0 : ((presentT2Attendance / allT2Attendance) * 100).toFixed(1),
    presentT3Percent: allT3Attendance === 0 ? 0 : ((presentT3Attendance / allT3Attendance) * 100).toFixed(1),
  });
});

// CREATE CHECKIN
export const createCheckIn = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, status } = req.body;
  const utcDate = new Date(date);
  utcDate.setUTCHours(0, 0, 0, 0);
  const attendanceFound = await Attendance.findOne({ date: utcDate, employee });
  if (attendanceFound) return next(new AppError("This Attendance is already found for this date", 409));
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));
  if (new Date(date) < new Date(employeeFound.hireDate)) return next(new AppError("Can't create attendance date before employee hire date", 400));
  await calc.checkForHolidays(date, employeeFound);
  const checkInData = { employee, date: utcDate, status };
  if (status === "Present") {
    Object.assign(checkInData, {
      checkInTime,
      lateDurationInHours: calc.calcLateDurationInHours(checkInTime, employeeFound),
    });
  }
  const newCheckIn = await Attendance.create(checkInData);
  return res.status(200).json({
    message: "CheckIn added successfully",
    data: newCheckIn,
  });
});

// CREATE CHECKOUT
export const createCheckOut = asyncHandler(async (req, res, next) => {
  const { checkOutTime } = req.body;
  const { id } = req.params;
  const attendanceFound = await Attendance.findById(id).populate("employee", "defaultCheckInTime defaultCheckOutTime");
  if (!attendanceFound.checkInTime) return next(new AppError("You must provide checkIn time first", 400));
  calc.checkOutAfterCheckIn(attendanceFound.checkInTime, checkOutTime);
  attendanceFound.checkOutTime = checkOutTime;
  attendanceFound.overtimeDurationInHours = calc.calcOvertimeDurationInHours(checkOutTime, attendanceFound.employee);
  await attendanceFound.save();
  return res.status(201).json({
    message: "checkOut added successfully",
    data: attendanceFound,
  });
});

// CREATE ATTENDANCE
export const createAttendance = asyncHandler(async (req, res, next) => {
  const { employee, date, checkInTime, checkOutTime, status } = req.body;
  const attendanceUtcDate = new Date(date);
  attendanceUtcDate.setUTCHours(0, 0, 0, 0);

  // check for attendance if it's exist in database already
  const attendanceFound = await Attendance.findOne({ date: attendanceUtcDate, employee });
  if (attendanceFound) return next(new AppError("This Attendance is already found for this date", 409));

  // check for employee and hireDate and get default checkIn and checkOut of employee
  const employeeFound = await Employee.findById(employee);
  if (!employeeFound) return next(new AppError("Employee not found", 404));


  const hireUtcDate = new Date(employeeFound.hireDate);
  hireUtcDate.setUTCHours(0, 0, 0, 0);

  if (attendanceUtcDate < hireUtcDate) return next(new AppError("Can't create attendance date before employee hire date", 400));

  // check for holidays
  await calc.checkForHolidays(date, employeeFound);

  const attendanceData = {
    employee,
    date: attendanceUtcDate,
    status,
  };

  // if present:
  // we will check that checkOut is after checkIn time
  // we will need checkIn and checkOut and calculate late and overtime hours
  // we will add them to attendance data that will be added in database
  if (status === "Present") {
    calc.checkOutAfterCheckIn(checkInTime, checkOutTime);

    Object.assign(attendanceData, {
      checkInTime,
      checkOutTime,
      lateDurationInHours: calc.calcLateDurationInHours(checkInTime, employeeFound),
      overtimeDurationInHours: calc.calcOvertimeDurationInHours(checkOutTime, employeeFound),
    });
  }

  // if present (already checkIn and checkOut and late and overtime hours are added to attendance data)
  // if absent or on leave it will not add checkIn or checkOut and will set late and overtime hours as zeros
  const newAttendance = await Attendance.create(attendanceData);

  return res.status(201).json({
    message: "Attendance added successfully",
    data: newAttendance,
  });
});

// UPDATE ATTENDANCE
export const updateAttendance = asyncHandler(async (req, res, next) => {
  const { checkInTime, checkOutTime, status } = req.body;
  const { id } = req.params;
  const attendance = await Attendance.findById(id).populate("employee", "defaultCheckInTime defaultCheckOutTime");
  if (status === "Present") {
    if (checkInTime) {
      attendance.checkInTime = checkInTime;
      attendance.lateDurationInHours = calc.calcLateDurationInHours(checkInTime, attendance.employee);
    }
    if (checkOutTime) {
      calc.checkOutAfterCheckIn(checkInTime, checkOutTime);
      attendance.checkOutTime = checkOutTime;
      attendance.overtimeDurationInHours = calc.calcOvertimeDurationInHours(checkOutTime, attendance.employee);
    }
    if (checkOutTime === "") {
      attendance.checkOutTime = undefined;
      attendance.overtimeDurationInHours = 0;
    }
  } else if (status === "Absent") {
    attendance.checkInTime = undefined;
    attendance.checkOutTime = undefined;
    attendance.lateDurationInHours = 0;
    attendance.overtimeDurationInHours = 0;
  }
  attendance.status = status || attendance.status;
  await attendance.save();
  return res.status(200).json({
    message: "Attendance Updated successfully",
    data: attendance,
  });
});

// DELETE ATTENDANCE
export const deleteAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const attendance = await Attendance.findById(id);
  if (!attendance) return next(new AppError("Attendance not found", 404));
  attendance.isDeleted = true;
  attendance.deletedAt = new Date();
  await attendance.save();
  res.status(200).json({ message: "Attendance deleted successfully" });
});
