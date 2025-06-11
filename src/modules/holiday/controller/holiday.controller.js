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

  const newHoliday = new Holiday({ name, date, type });
  const savedHoliday = await newHoliday.save();
  res.status(201).json(savedHoliday);
});

export const getHolidays = asyncHandler(async (req, res) => {
  const { type, date, page = 1, limit = 10 } = req.query;
  let query = {};

  if (type) query.type = type;
  if (date) query.date = new Date(date);

  const holidays = await Holiday.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  res.status(200).json(holidays);
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, date, type } = req.body;

  const holiday = await Holiday.findById(id);
  if (!holiday) return res.status(404).json({ error: "Holiday not found" });

  const existingHoliday = await Holiday.findOne({ date, _id: { $ne: id } });
  if (existingHoliday)
    return res
      .status(400)
      .json({ error: "Another holiday exists on this date" });

  holiday.name = name || holiday.name;
  holiday.date = date ? new Date(date) : holiday.date;
  holiday.type = type || holiday.type;

  const updatedHoliday = await holiday.save();
  res.status(200).json(updatedHoliday);
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const holiday = await Holiday.findByIdAndDelete(id);
  if (!holiday) return res.status(404).json({ error: "Holiday not found" });

  res.status(200).json({ message: "Holiday deleted successfully" });
});
