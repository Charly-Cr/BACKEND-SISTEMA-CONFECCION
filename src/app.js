const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const router = require('./routes');
const errorHandler = require('./utils/errorHandler');
const rateLimit = require('express-rate-limit');
require('./models')

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // Límite de 2000 peticiones por cada IP
  message: {
    message: "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos, bro."
  },
});

app.set("trust proxy", 1);


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


// Usar cookie-parser para parsear las cookies
app.use(cookieParser());

app.use(express.json());
// app.use(helmet());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));


// rutas
app.use("/api/v1",limiter, router);
app.get("/", (req, res) => {
    return res.send("Child Connection API working!")
})

// middlewares después de las rutas
app.use(errorHandler)

module.exports = app;
