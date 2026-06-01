import { useEffect, useState } from "react"
import "./App.css"
import * as XLSX from "xlsx"

function App() {
  const [movimientos, setMovimientos] = useState(() => {
    const guardados = localStorage.getItem("movimientosCooperadora")
    return guardados ? JSON.parse(guardados) : []
  })

  const [mesBalance, setMesBalance] = useState("2026-05")
  const [anioBalance, setAnioBalance] = useState("2026")
  const [mostrarBalance, setMostrarBalance] = useState(false)
  const [mostrarBalanceMensual, setMostrarBalanceMensual] = useState(true)
  const [mostrarBalanceAnual, setMostrarBalanceAnual] = useState(false)
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("Todos")
  const [tipoImpresion, setTipoImpresion] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("Todas")
  const [busqueda, setBusqueda] = useState("")
  const [formulario, setFormulario] = useState({
    fecha: "",
    tipo: "Ingreso",
    categoria: "Bufete",
    formaPago: "Efectivo",
    concepto: "",
    monto: "",
    comprobante: "",
    observaciones: "",
  })

  useEffect(() => {
    localStorage.setItem("movimientosCooperadora", JSON.stringify(movimientos))
  }, [movimientos])

  const categoriasIngreso = [
    "Bufete",
    "Emergencia",
    "Compra de planillas / Inscripción",
    "Rifas",
    "Donaciones",
    "Cuota Cooperadora",
    "Transferencia recibida",
    "Otros",
  ]

  const categoriasEgreso = [
    "Compras",
    "Pagos",
    "Arreglos",
    "Mantenimiento",
    "Librería",
    "Limpieza",
    "Servicios",
    "Transferencia al banco",
    "Otros",
  ]

  const categorias =
    formulario.tipo === "Ingreso" ? categoriasIngreso : categoriasEgreso

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const totalEgresos = movimientos
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)



  const saldoTotal = totalIngresos - totalEgresos

  const saldoEfectivo = movimientos
    .filter((m) => m.formaPago === "Efectivo")
    .reduce((acc, m) => {
      return m.tipo === "Ingreso"
        ? acc + Number(m.monto)
        : acc - Number(m.monto)
    }, 0)

  const saldoBanco = movimientos
    .filter((m) => m.formaPago === "Transferencia" || m.formaPago === "Banco")
    .reduce((acc, m) => {
      return m.tipo === "Ingreso"
        ? acc + Number(m.monto)
        : acc - Number(m.monto)
    }, 0)

  const movimientosDelMes = movimientos.filter(
    (m) => m.fecha && m.fecha.startsWith(mesBalance)
  )

  const ingresosDelMes = movimientosDelMes
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const egresosDelMes = movimientosDelMes
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const resultadoDelMes = ingresosDelMes - egresosDelMes
  const movimientosDelAnio = movimientos.filter(
    (m) => m.fecha && m.fecha.startsWith(anioBalance)
  )

  const ingresosDelAnio = movimientosDelAnio
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const egresosDelAnio = movimientosDelAnio
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const resultadoDelAnio = ingresosDelAnio - egresosDelAnio

  function manejarCambio(e) {
    const { name, value } = e.target

    setFormulario({
      ...formulario,
      [name]: value,
    })
  }

  const movimientosFiltrados = movimientos.filter((m) => {
    const textoBusqueda = busqueda.toLowerCase()

    const coincideBusqueda =
      m.concepto.toLowerCase().includes(textoBusqueda) ||
      (m.observaciones || "").toLowerCase().includes(textoBusqueda) ||
      m.categoria.toLowerCase().includes(textoBusqueda) ||
      m.formaPago.toLowerCase().includes(textoBusqueda)

    if (busqueda && !coincideBusqueda) return false
    if (filtroDesde && m.fecha < filtroDesde) return false
    if (filtroHasta && m.fecha > filtroHasta) return false
    if (filtroTipo !== "Todos" && m.tipo !== filtroTipo) return false
    if (filtroCategoria !== "Todas" && m.categoria !== filtroCategoria) return false

    return true
  })

  const ingresosFiltrados = movimientosFiltrados
    .filter((m) => m.tipo === "Ingreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const egresosFiltrados = movimientosFiltrados
    .filter((m) => m.tipo === "Egreso")
    .reduce((acc, m) => acc + Number(m.monto), 0)

  const saldoFiltrado = ingresosFiltrados - egresosFiltrados

  function formatearFecha(fecha) {
    if (!fecha) return ""
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR")
  }

  const textoPeriodo = (() => {
    if (filtroDesde && filtroHasta) {
      return `Período: ${formatearFecha(filtroDesde)} al ${formatearFecha(filtroHasta)}`
    }

    if (filtroDesde) {
      return `Período: desde ${formatearFecha(filtroDesde)}`
    }

    if (filtroHasta) {
      return `Período: hasta ${formatearFecha(filtroHasta)}`
    }

    return "Período: todos los movimientos"
  })()

  function guardarMovimiento(e) {
    e.preventDefault()

    if (
      !formulario.fecha ||
      !formulario.tipo ||
      !formulario.categoria ||
      !formulario.monto
    ) {
      alert("Complete los campos obligatorios")
      return
    }

    const movimientoGuardado = {
      id: editandoId || Date.now(),
      ...formulario,
      monto: Number(formulario.monto),
    }

    if (editandoId) {
      setMovimientos(
        movimientos.map((m) =>
          m.id === editandoId ? movimientoGuardado : m
        )
      )
      setEditandoId(null)
    } else {
      setMovimientos([movimientoGuardado, ...movimientos])
    }
    setFormulario({
      fecha: "",
      tipo: "Ingreso",
      categoria: "Bufete",
      destino: "Caja General",
      formaPago: "Efectivo",
      concepto: "",
      monto: "",
      observaciones: "",
      comprobante: "",
    })
  }

  function eliminarMovimiento(id) {
    const confirmar = confirm("¿Eliminar este movimiento?")
    if (!confirmar) return

    setMovimientos(movimientos.filter((m) => m.id !== id))
  }

  function editarMovimiento(movimiento) {
    setFormulario({
      fecha: movimiento.fecha,
      tipo: movimiento.tipo,
      categoria: movimiento.categoria,
      formaPago: movimiento.formaPago,
      concepto: movimiento.concepto,
      monto: movimiento.monto,
      comprobante: movimiento.comprobante || "",
      observaciones: movimiento.observaciones || "",
    })

    setEditandoId(movimiento.id)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function imprimirLibroCaja() {
    setTipoImpresion("libro")
    setTimeout(() => window.print(), 100)
  }

  function imprimirBalanceAnual() {
    setTipoImpresion("balance")
    setTimeout(() => window.print(), 100)
  }

  const exportarExcel = () => {
    const datos = movimientosFiltrados.map((m) => ({
      Fecha: new Date(
        m.fecha + "T00:00:00"
      ).toLocaleDateString("es-AR"),

      Tipo: m.tipo,
      Categoría: m.categoria,
      "Forma de pago": m.formaPago,

      Concepto: m.concepto || "",

      Observaciones: m.observaciones || "",

      Comprobante: m.comprobante || "",

      Monto: Number(m.monto)
    }))

    const hoja = XLSX.utils.json_to_sheet(datos)

    const libro = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Libro de Caja"
    )

    XLSX.writeFile(
      libro,
      "Libro_Caja_Cooperadora.xlsx"
    )
  }
  const maximoBalance = Math.max(ingresosDelAnio, egresosDelAnio, 1)

  const porcentajeIngresos = (ingresosDelAnio / maximoBalance) * 100
  const porcentajeEgresos = (egresosDelAnio / maximoBalance) * 100

  return (
    <div
      className={`contenedor ${tipoImpresion === "libro"
        ? "imprimir-libro"
        : tipoImpresion === "balance"
          ? "imprimir-balance"
          : ""
        }`}
    >
      <header className="encabezado">
        <h1>Sistema de Cooperadora Escolar</h1>
        <br />
        <p>Registro de ingresos, egresos, caja, banco y balance anual</p>
      </header>

      <section className="tarjetas">
        <div className="tarjeta">
          <span>Total ingresos</span>
          <strong>${totalIngresos.toLocaleString("es-AR")}</strong>
        </div>

        <div className="tarjeta">
          <span>Total egresos</span>
          <strong>${totalEgresos.toLocaleString("es-AR")}</strong>
        </div>

        <div className="tarjeta destacada">
          <span>Saldo total</span>
          <strong>${saldoTotal.toLocaleString("es-AR")}</strong>
        </div>

        <div className="tarjeta">
          <span>Saldo efectivo</span>
          <strong>${saldoEfectivo.toLocaleString("es-AR")}</strong>
        </div>

        <div className="tarjeta">
          <span>Saldo banco</span>
          <strong>${saldoBanco.toLocaleString("es-AR")}</strong>
        </div>
      </section>

      <section className="panel">
        <button
          type="button"
          className="botonDesplegable"
          onClick={() => setMostrarBalance(!mostrarBalance)}
        >
          {mostrarBalance ? "▼" : "▶"} Balance
        </button>

        {mostrarBalance && (
          <div className="margenArriba">
            <div className="botonesBalance">
              <button
                type="button"
                onClick={() => setMostrarBalanceMensual(!mostrarBalanceMensual)}
              >
                {mostrarBalanceMensual ? "▼" : "▶"} Mensual
              </button>

              <button
                type="button"
                onClick={() => setMostrarBalanceAnual(!mostrarBalanceAnual)}
              >
                {mostrarBalanceAnual ? "▼" : "▶"} Anual
              </button>
            </div>

            {mostrarBalanceMensual && (
              <section className="subPanel">
                <h2>Balance mensual</h2>

                <div className="selectorMes">
                  <strong>Mes:</strong>
                  <input
                    type="month"
                    value={mesBalance}
                    onChange={(e) => setMesBalance(e.target.value)}
                  />
                </div>



                <div className="tarjetas">
                  <div className="tarjeta">
                    <span>Ingresos del mes</span>
                    <strong>${ingresosDelMes.toLocaleString("es-AR")}</strong>
                  </div>

                  <div className="tarjeta">
                    <span>Egresos del mes</span>
                    <strong>${egresosDelMes.toLocaleString("es-AR")}</strong>
                  </div>

                  <div className="tarjeta destacada">
                    <span>Resultado del mes</span>
                    <strong>${resultadoDelMes.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              </section>
            )}

            {mostrarBalanceAnual && (
              <section className="subPanel">
                <h2>Balance anual</h2>

                <div className="selectorMes">
                  <strong>Año:</strong>
                  <input
                    type="number"
                    value={anioBalance}
                    onChange={(e) => setAnioBalance(e.target.value)}
                  />
                </div>
                <div className="accionesBalanceAnual">
                  <button
                    type="button"
                    className="botonImprimirBalance"
                    onClick={imprimirBalanceAnual}
                  >
                    📄 Imprimir Balance Anual
                  </button>
                </div>

                <div className="tarjetas">
                  <div className="tarjeta">
                    <span>Ingresos del año</span>
                    <strong>${ingresosDelAnio.toLocaleString("es-AR")}</strong>
                  </div>

                  <div className="tarjeta">
                    <span>Egresos del año</span>
                    <strong>${egresosDelAnio.toLocaleString("es-AR")}</strong>
                  </div>

                  <div className="tarjeta destacada">
                    <span>Resultado anual</span>
                    <strong>${resultadoDelAnio.toLocaleString("es-AR")}</strong>
                  </div>
                </div>

                <div className="columnasCategorias">
                  <div className="resumenCategorias">
                    <h3>Ingresos por categoría</h3>

                    {categoriasIngreso.map((categoria) => {
                      const totalCategoria = movimientosDelAnio
                        .filter(
                          (m) =>
                            m.tipo === "Ingreso" &&
                            m.categoria === categoria
                        )
                        .reduce((acc, m) => acc + Number(m.monto), 0)

                      if (totalCategoria === 0) return null

                      return (
                        <div className="filaCategoria" key={categoria}>
                          <span>{categoria}</span>
                          <strong>${totalCategoria.toLocaleString("es-AR")}</strong>
                        </div>
                      )
                    })}
                  </div>

                  <div className="resumenCategorias">
                    <h3>Egresos por categoría</h3>

                    {categoriasEgreso.map((categoria) => {
                      const totalCategoria = movimientosDelAnio
                        .filter(
                          (m) =>
                            m.tipo === "Egreso" &&
                            m.categoria === categoria
                        )
                        .reduce((acc, m) => acc + Number(m.monto), 0)

                      if (totalCategoria === 0) return null

                      return (
                        <div className="filaCategoria" key={categoria}>
                          <span>{categoria}</span>
                          <strong>${totalCategoria.toLocaleString("es-AR")}</strong>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="graficoBalance">
                  <h3>Gráfico para Asamblea Anual</h3>

                  <div className="barraGrafico">
                    <span>Ingresos</span>

                    <div className="contenedorBarra">
                      <div
                        className="barra ingresos"
                        style={{ width: `${porcentajeIngresos}%` }}
                      >
                        ${ingresosDelAnio.toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>

                  <div className="barraGrafico">
                    <span>Egresos</span>

                    <div className="contenedorBarra">
                      <div
                        className="barra egresos"
                        style={{ width: `${porcentajeEgresos}%` }}
                      >
                        ${egresosDelAnio.toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="balanceAnualImpresion">
                  <h2>E.P. N° 91 “PROVINCIAS ARGENTINAS”</h2>
                  <h3>Cooperadora Escolar</h3>

                  <h1>Balance Anual {anioBalance}</h1>

                  <div className="resumenImpresionBalance">
                    <p>
                      <strong>Ingresos totales:</strong> ${ingresosDelAnio.toLocaleString("es-AR")}
                    </p>

                    <p>
                      <strong>Egresos totales:</strong> ${egresosDelAnio.toLocaleString("es-AR")}
                    </p>

                    <p>
                      <strong>Resultado final:</strong> ${resultadoDelAnio.toLocaleString("es-AR")}
                    </p>
                  </div>

                  <h3>Ingresos por categoría</h3>

                  {categoriasIngreso.map((categoria) => {
                    const totalCategoria = movimientosDelAnio
                      .filter((m) => m.tipo === "Ingreso" && m.categoria === categoria)
                      .reduce((acc, m) => acc + Number(m.monto), 0)

                    if (totalCategoria === 0) return null

                    return (
                      <p className="lineaBalance" key={categoria}>
                        <span>{categoria}</span>
                        <strong>${totalCategoria.toLocaleString("es-AR")}</strong>
                      </p>
                    )
                  })}

                  <h3>Egresos por categoría</h3>

                  {categoriasEgreso.map((categoria) => {
                    const totalCategoria = movimientosDelAnio
                      .filter((m) => m.tipo === "Egreso" && m.categoria === categoria)
                      .reduce((acc, m) => acc + Number(m.monto), 0)

                    if (totalCategoria === 0) return null

                    return (
                      <p className="lineaBalance" key={categoria}>
                        <span>{categoria}</span>
                        <strong>${totalCategoria.toLocaleString("es-AR")}</strong>
                      </p>
                    )
                  })}

                  <div className="firmasImpresion">
                    <div>
                      <span>_________________________</span>
                      <p>Presidente</p>
                    </div>

                    <div>
                      <span>_________________________</span>
                      <p>Tesorero/a</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Nuevo movimiento</h2>

        <form onSubmit={guardarMovimiento} className="formulario">
          <label>
            Fecha
            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              onChange={manejarCambio}
            />
          </label>

          <label>
            Tipo
            <select
              name="tipo"
              value={formulario.tipo}
              onChange={(e) => {
                const nuevoTipo = e.target.value
                setFormulario({
                  ...formulario,
                  tipo: nuevoTipo,
                  categoria: nuevoTipo === "Ingreso" ? "Bufete" : "Compras",
                })
              }}
            >
              <option>Ingreso</option>
              <option>Egreso</option>
            </select>
          </label>

          <label>
            Categoría
            <select
              name="categoria"
              value={formulario.categoria}
              onChange={manejarCambio}
            >
              {categorias.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </label>


          <label>
            Forma de pago
            <select
              name="formaPago"
              value={formulario.formaPago}
              onChange={manejarCambio}
            >
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Banco</option>
            </select>
          </label>

          <label>
            Concepto
            <input
              type="text"
              name="concepto"
              value={formulario.concepto}
              onChange={manejarCambio}
              placeholder="Concepto (opcional)"
            />
          </label>

          <label>
            Monto
            <input
              type="number"
              name="monto"
              value={formulario.monto}
              onChange={manejarCambio}
              placeholder="Ej: 15000"
            />
          </label>

          <label>
            Comprobante
            <input
              type="text"
              name="comprobante"
              value={formulario.comprobante}
              onChange={manejarCambio}
              placeholder="Ej: Factura 0003-000125"
            />
          </label>

          <label className="observaciones">
            Observaciones
            <textarea
              name="observaciones"
              value={formulario.observaciones}
              onChange={manejarCambio}
              placeholder="Detalle, comprobante, quién entregó, etc."
            />
          </label>

          <button type="submit">
            {editandoId ? "Guardar cambios" : "Guardar movimiento"}
          </button>
        </form>
      </section>

      <section className="panel">
        <button
          type="button"
          className="botonDesplegable"
          onClick={() => setMostrarMovimientos(!mostrarMovimientos)}
        >
          {mostrarMovimientos ? "▼" : "▶"} Movimientos cargados
        </button>

        {mostrarMovimientos && (
          <div className="margenArriba">
            <div className="filtrosMovimientos">
              <label className="buscadorMovimientos">
                Buscar
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar concepto, observaciones, categoría..."
                />
              </label>

              <label>
                Desde
                <input
                  type="date"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                />
              </label>

              <label>
                Hasta
                <input
                  type="date"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                />
              </label>

              <label>
                Tipo
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                  <option>Todos</option>
                  <option>Ingreso</option>
                  <option>Egreso</option>
                </select>
              </label>

              <label>
                Categoría
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option>Todas</option>
                  {[...categoriasIngreso, ...categoriasEgreso].map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="periodoVisible">{textoPeriodo}</p>

            <div className="botonesMovimientos">
              <button
                type="button"
                className="botonImprimir"
                onClick={imprimirLibroCaja}
              >
                🖨️ Imprimir libro de caja
              </button>

              <button
                type="button"
                className="botonExcel"
                onClick={exportarExcel}
              >
                📊 Descargar Excel
              </button>
            </div>

            {movimientos.length === 0 ? (
              <p>No hay movimientos cargados todavía.</p>
            ) : (
              <>
                <div className="encabezadoImpresion">
                  <h2>E.P. N° 91 “PROVINCIAS ARGENTINAS”</h2>
                  <h3>Cooperadora Escolar</h3>
                  <br />
                  <h1>Libro de Caja</h1>
                  <br />
                  <p>Registro de ingresos y egresos</p>
                  <p>{textoPeriodo}</p>
                </div>

                <div className="panelTabla">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th>Forma</th>
                        <th>Concepto</th>
                        <th>Observaciones</th>
                        <th>Monto</th>
                        <th>Comprobante</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movimientosFiltrados.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {new Date(m.fecha + "T00:00:00").toLocaleDateString("es-AR")}
                          </td>
                          <td>{m.tipo}</td>
                          <td>{m.categoria}</td>
                          <td>{m.formaPago}</td>
                          <td>{m.concepto}</td>
                          <td>{m.observaciones || "-"}</td>
                          <td>${Number(m.monto).toLocaleString("es-AR")}</td>
                          <td>{m.comprobante || "-"}</td>
                          <td>
                            <div className="accionesTabla">
                              <button
                                type="button"
                                className="botonEditar"
                                onClick={() => editarMovimiento(m)}
                                title="Editar movimiento"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                className="botonEliminar"
                                onClick={() => eliminarMovimiento(m.id)}
                                title="Eliminar movimiento"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="totalesImpresion">
                  <p>
                    <strong>Total ingresos:</strong> $
                    {ingresosFiltrados.toLocaleString("es-AR")}
                  </p>

                  <p>
                    <strong>Total egresos:</strong> $
                    {egresosFiltrados.toLocaleString("es-AR")}
                  </p>

                  <p>
                    <strong>Saldo final:</strong> $
                    {saldoFiltrado.toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="firmasImpresion">
                  <div>
                    <span>_________________________</span>
                    <p>Presidente</p>
                  </div>

                  <div>
                    <span>_________________________</span>
                    <p>Tesorero/a</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section >
    </div >
  )
}

export default App 