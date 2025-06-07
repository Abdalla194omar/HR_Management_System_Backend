import Holiday from "../../DB/model/Holiday.js";
import AppError from "./AppError.js";

export const checkOutAfterCheckIn = (checkInTime, checkOutTime) => {
  if (timeToMinutes(checkInTime) > timeToMinutes(checkOutTime))
    throw new AppError("CheckOut time cannot be before checkIn time", 400);
};

export const checkForHolidays = async (date, employeeFound) => {
  const dateObject = new Date(date);
  const targetMonth = dateObject.getMonth() + 1;
  const targetYear = dateObject.getFullYear();

  const holidays = await Holiday.find({
    $expr: {
      $and: [
        { $eq: [{ $month: "$date" }, targetMonth] },
        { $eq: [{ $year: "$date" }, targetYear] },
      ],
    },
  });
  console.log("holidays", holidays);
  for (const holiday of holidays) {
    console.log(
      new Date(holiday.date).toLocaleDateString(),
      "==",
      new Date(date).toLocaleDateString()
    );
    if (
      new Date(date).toLocaleDateString() ==
      new Date(holiday.date).toLocaleDateString()
    )
      throw new AppError("Attendance can't be in holiday", 400);
  }

  const weekdayName = new Date(date).toLocaleString("en-US", {
    weekday: "long",
  });
  console.log("weekdayName", weekdayName);
  if (employeeFound.weekendDays.includes(weekdayName)) {
    throw new AppError("Can't update attendance on employee's weekend day", 400)
  }
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map((number) => parseInt(number));
  const calcMinutes = hours * 60 + minutes;
  return calcMinutes;
};

export const minutesToHours = (minutes) => {
  const hours = +(minutes / 60).toFixed(2);
  return hours;
};

export const calcLateDurationInHours = (checkInTime, employeeFound) => {
  const minutesOfDefaultCheckInTime = timeToMinutes(
    employeeFound.defaultCheckInTime
  );
  const minutesCheckInTime = timeToMinutes(checkInTime);
  return minutesCheckInTime > minutesOfDefaultCheckInTime
    ? minutesToHours(minutesCheckInTime - minutesOfDefaultCheckInTime)
    : 0;
};

export const calcOvertimeDurationInHours = (checkOutTime, employeeFound) => {
  const minutesOfDefaultCheckOutTime = timeToMinutes(
    employeeFound.defaultCheckOutTime
  );
  const minutesCheckOutTime = timeToMinutes(checkOutTime);
  return minutesCheckOutTime > minutesOfDefaultCheckOutTime
    ? minutesToHours(minutesCheckOutTime - minutesOfDefaultCheckOutTime)
    : 0;
};
