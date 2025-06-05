import Holiday from "../../../../DB/model/Holiday.js";
import asyncHandler from "express-async-handler";

export const createHoliday = asyncHandler(async (req, res) => {
  const { name, date, type } = req.body;

  const existingHoliday = await Holiday.findOne({ date });
  if (existingHoliday) {
    return res
      .status(400)
      .json({ error: "Holiday already exists on this date" });
  }

  const newHoliday = new Holiday({
    name,
    date,
    type,
  });

  const savedHoliday = await newHoliday.save();
  res.status(201).json(savedHoliday);
});
