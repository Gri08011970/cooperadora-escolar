const mongoose = require("mongoose")

const movimientoSchema = new mongoose.Schema(
  {
    fecha: {
      type: String,
      required: true,
    },

    tipo: {
      type: String,
      required: true,
    },

    categoria: {
      type: String,
      required: true,
    },

    formaPago: {
      type: String,
      required: true,
    },

    concepto: {
      type: String,
      default: "",
    },

    observaciones: {
      type: String,
      default: "",
    },

    monto: {
      type: Number,
      required: true,
    },

    comprobante: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Movimiento", movimientoSchema)