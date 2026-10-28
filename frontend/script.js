"use strict";

// DEMO MODE ONLY.
// These appointments are stored in the browser, not in Supabase.
// Replace the demo functions with backend API calls in the next stage.

const bookingForm = document.getElementById("bookingForm");
const doctorSelect = document.getElementById("doctor");
const dateInput = document.getElementById("date");
const bookingMessage = document.getElementById("bookingMessage");

const statusForm = document.getElementById("statusForm");
const referenceInput = document.getElementById("reference");
const statusMessage = document.getElementById("statusMessage");

const staffModal = document.getElementById("staffModal");
const staffLoginBtn = document.getElementById("staffLoginBtn");
const closeModalBtn = document.getElementById("closeModal");
const staffLoginForm = document.getElementById("staffLoginForm");
const loginMessage = document.getElementById("loginMessage");

const staffDashboard = document.getElementById("staffDashboard");
const appointmentTableBody = document.getElementById("appointmentTableBody");
const statusFilter = document.getElementById("statusFilter");
const adminMessage = document.getElementById("adminMessage");

const DEMO_STORAGE_KEY = "carepoint_demo_appointments";

function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}

function getAppointments() {
    try {
        const saved = localStorage.getItem(DEMO_STORAGE_KEY);
        const appointments = saved ? JSON.parse(saved) : [];

        return Array.isArray(appointments) ? appointments : [];
    } catch (error) {
        return [];
    }
}

function saveAppointments(appointments) {
    localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify(appointments)
    );
}

function generateReference() {
    const randomPart = Array.from(
        crypto.getRandomValues(new Uint8Array(4))
    )
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    return `CP-${randomPart}`;
}

function setMinimumDate() {
    const now = new Date();

    const today = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 10);

    dateInput.min = today;
}

function selectDoctor(name) {
    doctorSelect.value = name;

    document.getElementById("booking").scrollIntoView({
        behavior: "smooth"
    });
}

document.querySelectorAll(".choose-doctor").forEach((button) => {
    button.addEventListener("click", () => {
        selectDoctor(button.dataset.doctor);
    });
});

// Appointment booking: demo storage only.
bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showMessage(bookingMessage, "");

    const formData = new FormData(bookingForm);

    const patientName = String(
        formData.get("patientName") || ""
    ).trim();

    const phone = String(
        formData.get("phone") || ""
    ).trim();

    const email = String(
        formData.get("email") || ""
    ).trim();

    const doctor = String(
        formData.get("doctor") || ""
    );

    const date = String(
        formData.get("date") || ""
    );

    const time = String(
        formData.get("time") || ""
    );

    const reason = String(
        formData.get("reason") || ""
    ).trim();

    if (patientName.length < 2) {
        showMessage(
            bookingMessage,
            "Please enter a name containing at least 2 characters.",
            "error"
        );
        return;
    }

    if (!/^[+0-9() .-]{7,20}$/.test(phone)) {
        showMessage(
            bookingMessage,
            "Please enter a valid phone number.",
            "error"
        );
        return;
    }

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        showMessage(
            bookingMessage,
            "Please enter a valid email address.",
            "error"
        );
        return;
    }

    const now = new Date();

    const today = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 10);

    if (!date || date < today) {
        showMessage(
            bookingMessage,
            "Please choose today or a future date.",
            "error"
        );
        return;
    }

    const appointmentDateTime = new Date(`${date}T${time}:00`);
    if (
        date === today &&
        appointmentDateTime <= now
    ) {
        showMessage(
            bookingMessage,
            "That time has passed. Please choose a later time.",
            "error"
        );
        return;
    }

    if (reason.length > 500) {
        showMessage(
            bookingMessage,
            "The reason must be 500 characters or fewer.",
            "error"
        );
        return;
    }

    const appointments = getAppointments();

    const occupiedSlot = appointments.some((appointment) => {
        const active = ["pending", "confirmed"].includes(
            appointment.status
        );

        return (
            active &&
            appointment.doctor === doctor &&
            appointment.date === date &&
            appointment.time === time
        );
    });

    if (occupiedSlot) {
        showMessage(
            bookingMessage,
            "This demo slot is already booked. Please select another time.",
            "error"
        );
        return;
    }

    const appointment = {
        reference: generateReference(),
        patientName,
        phone,
        email,
        doctor,
        date,
        time,
        reason,
        status: "pending"
    };

    appointments.push(appointment);
    saveAppointments(appointments);

    showMessage(
        bookingMessage,
        `Demo booking successful! Your reference number is ${appointment.reference}. Save this number to check the status.`,
        "success"
    );

    referenceInput.value = appointment.reference;

    bookingForm.reset();
    setMinimumDate();
});

// Appointment status lookup: demo storage only.
statusForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const reference = referenceInput.value
        .trim()
        .toUpperCase();

    const appointment = getAppointments().find(
        (item) => item.reference === reference
    );

    if (!appointment) {
        showMessage(
            statusMessage,
            "No demo appointment was found for that reference number.",
            "error"
        );
        return;
    }

    showMessage(
        statusMessage,
        `Reference: ${appointment.reference} | Doctor: ${appointment.doctor} | Date: ${appointment.date} | Time: ${appointment.time} | Status: ${appointment.status}`,
        "success"
    );
});

// Staff login modal.
function openStaffModal() {
    staffModal.hidden = false;
    document.getElementById("staffUsername").focus();
}

function closeStaffModal() {
    staffModal.hidden = true;
}

staffLoginBtn.addEventListener("click", openStaffModal);
closeModalBtn.addEventListener("click", closeStaffModal);

staffModal.addEventListener("click", (event) => {
    if (event.target === staffModal) {
        closeStaffModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeStaffModal();
    }
});

// DEMO LOGIN ONLY. Never use this for real authentication.
// The next stage will replace this with a server-side login.
staffLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showMessage(
        loginMessage,
        "Demo login is not connected yet. Complete the backend stage to enable secure staff sign-in.",
        "error"
    );
});

function renderAppointments() {
    const appointments = getAppointments();
    const selectedStatus = statusFilter.value;

    const filtered = appointments.filter((appointment) => {
        return (
            !selectedStatus ||
            appointment.status === selectedStatus
        );
    });

    appointmentTableBody.replaceChildren();

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No demo appointments to display.";

        row.appendChild(cell);
        appointmentTableBody.appendChild(row);
        return;
    }

    filtered.forEach((appointment) => {
        const row = document.createElement("tr");

        function addCell(value) {
            const cell = document.createElement("td");
            cell.textContent = String(value ?? "");
            row.appendChild(cell);
            return cell;
        }

        addCell(appointment.reference);
        addCell(appointment.patientName);
        addCell(appointment.doctor);
        addCell(appointment.date);
        addCell(appointment.time);

        const statusCell = addCell(appointment.status);
        const statusSelect = document.createElement("select");

        ["pending", "confirmed", "completed", "cancelled"]
            .forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                option.selected = appointment.status === status;
                statusSelect.appendChild(option);
            });

        const actionCell = document.createElement("td");
        const saveButton = document.createElement("button");

        saveButton.type = "button";
        saveButton.className = "btn btn-primary";
        saveButton.textContent = "Save";

        saveButton.addEventListener("click", () => {
            const allAppointments = getAppointments();

            const target = allAppointments.find(
                (item) => item.reference === appointment.reference
            );

            if (!target) {
                showMessage(
                    adminMessage,
                    "Appointment not found.",
                    "error"
                );
                return;
            }

            target.status = statusSelect.value;
            saveAppointments(allAppointments);

            showMessage(
                adminMessage,
                "Demo appointment status updated.",
                "success"
            );

            renderAppointments();
        });

        actionCell.append(statusSelect, saveButton);
        row.appendChild(actionCell);

        appointmentTableBody.appendChild(row);
    });
}

statusFilter.addEventListener("change", renderAppointments);

document.getElementById("refreshBtn").addEventListener(
    "click",
    renderAppointments
);

// The demo dashboard is intentionally not enabled until
// secure server-side authentication is implemented.
document.getElementById("logoutBtn").addEventListener(
    "click",
    () => {
        staffDashboard.hidden = true;
    }
);

setMinimumDate();