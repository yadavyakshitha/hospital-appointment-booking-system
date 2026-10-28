-- ============================================
-- HOSPITAL APPOINTMENT BOOKING SYSTEM
-- DATABASE SCHEMA
-- Database: Supabase PostgreSQL
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. DOCTORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification VARCHAR(150),
    experience_years INTEGER DEFAULT 0
        CHECK (experience_years >= 0),
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (consultation_fee >= 0),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. DOCTOR SLOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.doctor_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL
        REFERENCES public.doctors(id)
        ON DELETE CASCADE,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_slot_time
        CHECK (end_time > start_time),

    CONSTRAINT unique_doctor_slot
        UNIQUE (doctor_id, start_time, end_time)
);

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL
        REFERENCES public.doctors(id)
        ON DELETE RESTRICT,

    slot_id UUID NOT NULL UNIQUE
        REFERENCES public.doctor_slots(id)
        ON DELETE RESTRICT,

    patient_name VARCHAR(100) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'cancelled',
                'completed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_patient_name
        CHECK (LENGTH(TRIM(patient_name)) > 0),

    CONSTRAINT valid_patient_email
        CHECK (LENGTH(TRIM(patient_email)) > 0)
);

-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_specialty
ON public.doctors(specialty);

CREATE INDEX IF NOT EXISTS idx_doctor_slots_doctor
ON public.doctor_slots(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_slots_start_time
ON public.doctor_slots(start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor
ON public.appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON public.appointments(status);

CREATE INDEX IF NOT EXISTS idx_appointments_created_at
ON public.appointments(created_at);

-- ============================================
-- 5. UPDATE TIMESTAMP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_updated_at
ON public.appointments;

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 6. BOOK APPOINTMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.book_appointment(
    p_doctor_id UUID,
    p_slot_id UUID,
    p_patient_name TEXT,
    p_patient_email TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot public.doctor_slots%ROWTYPE;
    v_appointment_id UUID;
BEGIN
    -- Validate patient details
    IF p_patient_name IS NULL
       OR LENGTH(TRIM(p_patient_name)) = 0 THEN
        RAISE EXCEPTION 'Patient name is required';
    END IF;

    IF p_patient_email IS NULL
       OR LENGTH(TRIM(p_patient_email)) = 0 THEN
        RAISE EXCEPTION 'Patient email is required';
    END IF;

    -- Lock the slot to prevent simultaneous booking
    SELECT *
    INTO v_slot
    FROM public.doctor_slots
    WHERE id = p_slot_id
      AND doctor_id = p_doctor_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment slot not found';
    END IF;

    -- Check slot availability
    IF NOT v_slot.is_available THEN
        RAISE EXCEPTION 'This appointment slot is already booked';
    END IF;

    -- Check that the slot is in the future
    IF v_slot.start_time <= NOW() THEN
        RAISE EXCEPTION 'Cannot book a past appointment slot';
    END IF;

    -- Check that the doctor is available
    IF NOT EXISTS (
        SELECT 1
        FROM public.doctors
        WHERE id = p_doctor_id
          AND available = TRUE
    ) THEN
        RAISE EXCEPTION 'Doctor is not available';
    END IF;

    -- Create the appointment
    INSERT INTO public.appointments (
        doctor_id,
        slot_id,
        patient_name,
        patient_email,
        reason,
        status
    )
    VALUES (
        p_doctor_id,
        p_slot_id,
        TRIM(p_patient_name),
        LOWER(TRIM(p_patient_email)),
        p_reason,
        'pending'
    )
    RETURNING id INTO v_appointment_id;

    -- Mark the slot unavailable
    UPDATE public.doctor_slots
    SET is_available = FALSE
    WHERE id = p_slot_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Appointment booked successfully',
        'appointment_id', v_appointment_id
    );
END;
$$;

-- ============================================
-- 7. SAMPLE DOCTOR DATA
-- ============================================

INSERT INTO public.doctors (
    name,
    specialty,
    qualification,
    experience_years,
    consultation_fee,
    available
)
VALUES
(
    'Dr. Ananya Rao',
    'Cardiology',
    'MBBS, MD Cardiology',
    8,
    600.00,
    TRUE
),
(
    'Dr. Rahul Sharma',
    'Dermatology',
    'MBBS, MD Dermatology',
    5,
    500.00,
    TRUE
),
(
    'Dr. Priya Reddy',
    'General Medicine',
    'MBBS, MD General Medicine',
    10,
    400.00,
    TRUE
),
(
    'Dr. Arjun Kumar',
    'Orthopedics',
    'MBBS, MS Orthopedics',
    7,
    550.00,
    TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF DATABASE SCHEMA
-- ============================================