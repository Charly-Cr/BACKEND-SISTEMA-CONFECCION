const multer = require("multer");
const path = require('path');
const fs = require('fs');

// Creamos la ruta de la carpeta temporal
const uploadPath = path.join(__dirname, '..', 'public', 'uploads');

// PRO-TIP: Esta lógica asegura que si la carpeta no existe, el servidor la cree al arrancar
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Evitamos duplicados: "pago.jpg" -> "1715364000-pago.jpg"
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

// Filtro para aceptar solo imágenes (Opcional pero recomendado)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPG, PNG, etc.)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por boucher
});

module.exports = upload;