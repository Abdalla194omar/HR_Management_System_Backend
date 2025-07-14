import mongoose from "mongoose";
import Holiday from "../../../../DB/model/Holiday.js";
import asyncHandler from "express-async-handler";

export const createHoliday = asyncHandler(async (req, res) => {
  const { name, date, type } = req.body;

  const existingHoliday = await Holiday.findOne({ date, isDeleted: false });
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
  let query = { isDeleted: false };

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
  if (holiday.isDeleted)
    return res.status(400).json({ error: "Cannot update deleted holiday" });

  const existingHoliday = await Holiday.findOne({
    date,
    _id: { $ne: id },
    isDeleted: false,
  });
  if (existingHoliday)
    return res
      .status(400)
      .json({ error: "Another holiday exists on this date" });

  holiday.name = name !== undefined ? name : holiday.name;
  holiday.date = date ? new Date(date) : holiday.date;
  holiday.type = type !== undefined ? type : holiday.type;

  try {
    const updatedHoliday = await holiday.save();
    res.status(200).json(updatedHoliday);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to update holiday", details: error.message });
  }
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Holiday ID" });
  }

  const holiday = await Holiday.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!holiday) {
    return res.status(404).json({ error: "Holiday not found" });
  }

  res
    .status(200)
    .json({ message: "Holiday deleted successfully (soft delete)" });
});
