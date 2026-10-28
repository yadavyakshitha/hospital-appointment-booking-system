const express = require("express");
const supabase = require("../supabase");
const {
    isNonEmptyString,
    isValidUuid
} = require("../utils/validation");

const router = express.Router();

/*
GET /api/doctors
Get all active doctors.

Optional query:
?search=cardiology
*/

router.get("/", async (req, res, next) => {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        if (search.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Search text is too long."
            });
        }

        let query = supabase
            .from("doctors")
            .select(
                "id, name, specialty, qualification, experience_years, consultation_fee, available, created_at"
            )
            .eq("available", true)
            .order("name");

        if (search) {
            const safeSearch = search.replace(/[,%()]/g, "");
            query = query.or(
                `name.ilike.%${safeSearch}%,specialty.ilike.%${safeSearch}%`
            );
        }

        const { data, error } = await query;

        if (error) {
            return next(error);
        }

        res.json({
            success: true,
            count: data.length,
            doctors: data
        });
    } catch (error) {
        next(error);
    }
});

/*
GET /api/doctors/:id
Get one active doctor.
*/

router.get("/:id", async (req, res, next) => {
    try {
        if (!isValidUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID."
            });
        }

        const { data, error } = await supabase
            .from("doctors")
            .select(
                "id, name, specialty, qualification, experience_years, consultation_fee, available"
            )
            .eq("id", req.params.id)
            .eq("available", true)
            .maybeSingle();

        if (error) {
            return next(error);
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }

        res.json({
            success: true,
            doctor: data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;