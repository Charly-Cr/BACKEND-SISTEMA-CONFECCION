const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * SUBIR ARCHIVO
 * @param {Object} file - Archivo de Multer
 * @param {Object} options - { folder: 'nombre_carpeta', public_id: 'nombre_archivo' }
 */

const uploadToCloudinary = async (file, options = {}) => {
    const { path: filePath, filename } = file;
    
    // Si no mandas carpeta, por defecto va a 'taller_app'
    const targetFolder = options.folder || "taller_app";
    
    try {
        const fileName = options.public_id || path.parse(filename).name;

        // Configuración mejorada
        const result = await cloudinary.uploader.upload(filePath, {
            folder: targetFolder,      // Cloudinary gestiona la carpeta nativamente
            public_id: fileName,       // Nombre del archivo
            unique_filename: true,     // Añade un sufijo aleatorio para evitar conflictos
            overwrite: false           // No sobrescribir si el nombre ya existe
        });

        return result;
    } catch (error) {
        console.error("❌ Cloudinary Error:", error);
        return null;
    } finally {
        // Borrar el archivo temporal de tu servidor (EC2) pase lo que pase
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

/**
 * BORRAR ARCHIVO
 */
const deleteFromCloudinary = async (url) => {
    try {
        if (!url || url.includes('no-image.jpg')) {
            return;
        }

        // Lógica de extracción de ID (Tu lógica está bien, la mantenemos)
        const urlSections = url.split('/');
        const uploadIndex = urlSections.findIndex(section => section === 'upload');
        
        // Saltamos 'upload' y la 'versión' (v123456)
        const publicIdWithExtension = urlSections.slice(uploadIndex + 2).join('/');
        const publicIdRaw = publicIdWithExtension.split('.')[0];
        const publicId = decodeURIComponent(publicIdRaw);

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Borrado en Cloudinary:", result);
        
    } catch (error) {
        console.error("Error al borrar en Cloudinary:", error);
    }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };