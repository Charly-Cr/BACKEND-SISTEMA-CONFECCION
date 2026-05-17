const app = require('./app');

const PORT = process.env.PORT || 8080;

const main = async() => {
    try {
        
    // Escucha en todas las interfaces si estamos en producción
    // app.listen(PORT, '::', () => {
        app.listen(PORT, '0.0.0.0', () => {
      console.log(`👉 Server running on port ${PORT}`);
      console.log(`👉 Link http://localhost:${PORT}`);
    });
    } catch(error){
        console.log(error);
    }
}

main();

  

