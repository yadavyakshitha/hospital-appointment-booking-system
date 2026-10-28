const express = require("express");
const supabase = require("../supabase");

const {
    isNonEmptyString,
    isValidUuid,
    isValidEmail
} = require("../utils/validation");

const router = express.Router();

/*
POST /api/appointments
Create an appointment request.
*/

router.post("/", async (req, res, next) => {
    try {
        const {
            doctorId,
            slotId,
            patientName,
            patientEmail,
            reason
        } = req.body;

        if (
            !isValidUuid(doctorId) ||
            !isValidUuid(slotId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Select a valid doctor and appointment slot."
            });
        }

        if (!isNonEmptyString(patientName, 100)) {
            return res.status(400).json({
                success: false,
                message: "Enter your name."
            });
        }

        if (!isValidEmail(patientEmail)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address."
            });
        }

        if (
            reason !== undefined &&
            reason !== null &&
            !isNonEmptyString(reason, 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "The appointment reason must be 1–500 characters."
            });
        }

        /*
        The database function must atomically:
        1. Verify the doctor and slot.
        2. Verify that the slot is in the future.
        3. Verify that the slot is available.
        4. Prevent concurrent duplicate bookings.
        5. Create the appointment.
        */

        const { data, error } = await supabase.rpc(
            "book_appointment",
            {
                p_doctor_id: doctorId,
                p_slot_id: slotId,
                p_patient_name: patientName.trim(),
                p_patient_email: patientEmail.trim().toLowerCase(),
                p_reason: reason ? reason.trim() : null
            }
        );

        if (error) {
            if (
                error.code === "P0001" ||
                error.code === "23505"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This appointment slot is unavailable. Please choose another."
                });
            }

            return next(error);
        }

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully.",
            appointment: data
        });
    } catch (error) {
        next(error);
    }
});

/*
GET /api/appointments
This endpoint is intentionally not implemented as a public
listing endpoint. Patient data must not be exposed without
authentication and authorization.
*/

router.get("/", (req, res) => {
    res.status(401).json({
        success: false,
        message:
            "Authentication is required to view appointment records."
    });
});

/*
DELETE /api/appointments/:id
Public cancellation is intentionally disabled because this
version does not establish the patient's identity.
*/

router.delete("/:id", (req, res) => {
    res.status(401).json({
        success: false,
        message:
            "Authentication is required to cancel an appointment."
    });
});

module.exports = router;