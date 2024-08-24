import express from 'express'
import bcrypt from 'bcrypt'
import admin from 'firebase-admin'
import serviceAccount from '../.config/firebaseServiceAccount.json' with {type: 'json'}
import { generateToken, verifyToken } from './auth.js'


//Inicializar Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})


const router = express.Router()
const db = admin.firestore()
const studentsCollect = db.collection('students')

//Middleware
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token){
        return res.status(401).json({
            message: 'No authorized'
        })
    }

    try {
        const user = verifyToken(token)
        req.user = user 
        next()
    } catch (error) {
        res.sendSatus(403)
    }
}

    router.post('/login', async (req, res) => {
        const {usser, password} = req.body
        const findUsser = await studentsCollect.where('usser', '==', usser).get()

        if (findUsser.empty) {
            return res.status(400).json({
                    error: 'Usser does not exist!'
                })
        }
        //si se encuentra aglo por defecto se usa esa informacion, funciona con doc
        const userDoc = findUsser.docs[0]
        const userdata = userDoc.data()

        const validPassword = await bcrypt.compare(password, userdata.password)

        if (!validPassword) { //No pensar como un booleano sino como una existencia de objeto o no existemcia
            return res.status(400).json({
                    error: 'Password Invalid'
                })
        }

        const token = generateToken({
            id: userDoc.id, usser: usser})
            res.status(201).json({
                token
            })
    })

//EndPoints
//Crear Estudiantes, validaciones con password, token
router.post('/create', authenticateToken , async (req, res) => {
    const { name, apaterno, amaterno, direccion, 
        telefono, mail, usser, password } = req.body

        //Validar correo y usuario
        const findUsser = await studentsCollect.where('usser', '==', usser).get()

        const findMail = await studentsCollect.where('mail', '==', mail).get()

        if(!findUsser.empty){
            return res.status(400).json({
                error: 'Usser already exist!'
            })
        }

        if(!findMail.empty){
            return res.status(400).json({
                error: 'Mail already exist!'
            })
        }

        //Las contrasenas se deben de encriptar, nunca se deben guardar en base de datos igual 
        //El proceso de encriptacion no es tan rapido asi que se usa await para esperar, para que si se necesita despues no haya errores
        const passHashed = await bcrypt.hash (password, 10)

        await studentsCollect.add({
            name,
            apaterno,
            amaterno,
            direccion,
            telefono,
            mail,
            usser,
            password: passHashed
        })
        res.status(201).json({
            message: 'success'
        })
    })

//     { 
//   "name": "Andert",
//   "apaterno": "Gamer",
//   "amaterno": "Pro",
//   "direccion": "UG",
//   "telefono": "3541017633",
//   "mail": "andertjuji@gmail.com",
//   "usser": "andert51",
//   "password": "12345"
// }

        router.get('/all', async(req, res) => {
            const colStudents = await studentsCollect.get()
            const students = colStudents.docs.map((doc) => ({ //map es como for each pero mas rapido
                id: doc.id, //doc es el registro de cada cosa en la base de datos, cada registro es un documento
                ...doc.data()
            }))
            res.status(201).json({
                message: 'success',
                students
            })
        })

        router.get('/student/:id', async(req, res) => {
            const id = req.params.id
            const colStudents = await studentsCollect.doc(id).get()
            if(!colStudents.exists){
                return res.status(401).json({
                    message: 'Cannot fin id'
                })
            }
            res.status(201).json({
                message: 'success',
                student: {
                    id: colStudents.id,
                    ...colStudents.data()
                }
            })
        })

        // Modificar un estudiante por ID
        router.put('/student/:id', async (req, res) => {
            const id = req.params.id
            const { name, apaterno, amaterno, direccion,
                    telefono, mail, usser, password } = req.body
        
            const studentRef = studentsCollect.doc(id)
            const studentDoc = await studentRef.get()
        
            if (!studentDoc.exists) {
                return res.status(404).json({
                    error: 'Student not found!'
                })
            }

             //Validar correo y usuario
            const findUsser = await studentsCollect.where('usser', '==', usser).get()

            const findMail = await studentsCollect.where('mail', '==', mail).get()

            if(!findUsser.empty){
                 return res.status(400).json({
                    error: 'Usser already exist!'
             })
             }

            if(!findMail.empty){
                 return res.status(400).json({
                 error: 'Mail already exist!'
             })
             }
             
            // Actucalizar valores
            const updates = {
                name,
                apaterno,
                amaterno,
                direccion,
                telefono,
                mail,
                usser
            }
        
            // Si se proporciona una nueva contraseña, encriptarla
            if (password) {
                const passHashed = await bcrypt.hash(password, 10)
                updates.password = passHashed
            }
        
            await studentRef.update(updates)
            res.status(200).json({
                message: 'Student updated successfully'
            })
        })

        // Eliminar Estudiante por ID
        router.delete('/student/:id', async (req, res) => {
        const id = req.params.id

        const studentRef = studentsCollect.doc(id)
        const studentDoc = await studentRef.get()

        if (!studentDoc.exists) {
            return res.status(404).json({
                error: 'Student not found!'
            })
        }

        await studentRef.delete()
        res.status(200).json({
            message: 'Student deleted successfully'
            })
        })


export default router