require("dotenv").config()
const mongoose = require("mongoose")

const Movimiento = require("./models/Movimiento")

const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Cooperadora funcionando 🚀",
  })
})
app.get("/movimientos", async (req, res) => {
  try {
    const movimientos = await Movimiento.find().sort({ fecha: -1 })
    res.json(movimientos)
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener movimientos" })
  }
})

app.post("/movimientos", async (req, res) => {
  try {
    const nuevoMovimiento = new Movimiento(req.body)
    const movimientoGuardado = await nuevoMovimiento.save()
    res.status(201).json(movimientoGuardado)
  } catch (error) {
    res.status(400).json({ mensaje: "Error al guardar movimiento" })
  }
})

app.delete("/movimientos/:id", async (req, res) => {
  try {
    await Movimiento.findByIdAndDelete(req.params.id)
    res.json({ mensaje: "Movimiento eliminado correctamente" })
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar movimiento" })
  }
})

const PORT = 5000
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo Atlas conectado correctamente 💚")
  })
  .catch((error) => {
    console.error("Error conectando a Mongo Atlas:", error.message)
  })


app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`)
})