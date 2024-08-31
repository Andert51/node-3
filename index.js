//Backend con encriptacion de contrasena,
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import studentsRoutes from './routes/students.js'
//Inicializamos el servidor
const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(bodyParser.json())

//Manejo de rutas
app.use('/api/students', studentsRoutes)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`Server Running at ${PORT}`)
})  