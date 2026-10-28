
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabase");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Hospital Appointment Booking API is running!",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working correctly",
  });
});

// Get all doctors
app.get("/api/doctors", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctors",
      });
    }

    res.json({
      success: true,
      doctors: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get a doctor by ID
app.get("/api/doctors/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctor",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({
      success: true,
      doctor: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Book an appointment
app.post("/api/appointments", async (req, res) => {
  try {
    const {
      patient_name,
      patient_email,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
    } = req.body;

    if (
      !patient_name ||
      !patient_email ||
      !doctor_id ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient name, email, doctor, date, and time are required",
      });
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          patient_name,
          patient_email,
          doctor_id,
          appointment_date,
          appointment_time,
          reason: reason || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to book appointment",
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get appointments
app.get("/api/appointments", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, doctors(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointments",
      });
    }

    res.json({
      success: true,
      appointments: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update appointment status
app.patch("/api/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status",
      });
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update appointment",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment status updated",
      appointment: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Hospital API running at http://localhost:${PORT}`);
});
