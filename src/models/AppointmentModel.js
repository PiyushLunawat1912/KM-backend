import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    name: String,
    lastName: String,   
    email: String,
    phone: String,   
    date: Date,
    message: String,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;