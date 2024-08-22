//Backend con encriptacion de contrasena,
import express from 'express'
import bodyParser from 'body-parser'
import studentsRoutes from './routes/students.js'
//Inicializamos el servidor
const app = express()
app.use(bodyParser.json())

//Manejo de rutas
app.use('/api/students', studentsRoutes)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`Server Running at ${PORT}`)
})