/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var app = express();

// Session
var expressSession = require('express-session');

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

var swig  = require('swig');
app.use(express.static('public'));
// Leer body
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

// Cliente de Mongo
var MongoClient = require('mongodb').MongoClient;

//Crypto
const crypto = require('crypto');
const secreto = 'abcdefg';

// Router - zonaprivada
var zonaprivada = express.Router(); 

zonaprivada.use(function(req, res, next) {
  
  if ( req.session.usuario ) {
    // dejamos correr la petición
     next();
  } else {
     req.session.destino = req.originalUrl;
     console.log("va a : "+req.session.destino);
     res.redirect("/login");
  }
  
});

// Aplicar zonaprivada a las siguientes URLs
app.use("/foro",zonaprivada);
app.use("/foro/agregar",zonaprivada);

app.get('/', function (req, res) {
    res.redirect("/principal");
});
app.get('/principal', function (req, res) {
    var respuesta = swig.renderFile('vistas/principal.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/admisiones', function (req, res) {
    var respuesta = swig.renderFile('vistas/admisiones.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/autoridades', function (req, res) {
    var respuesta = swig.renderFile('vistas/autoridades.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/contactanos', function (req, res) {
    var respuesta = swig.renderFile('vistas/contactanos.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/nivel-inicial', function (req, res) {
    var respuesta = swig.renderFile('vistas/nivel-inicial.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/primaria', function (req, res) {
    var respuesta = swig.renderFile('vistas/primaria.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/secundaria', function (req, res) {
    var respuesta = swig.renderFile('vistas/secundaria.html', {
        error : req.query.error
    });
    res.send(respuesta);
});

app.get('/foro', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      console.log("Error:  "+err);
      if (err) {
        res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
                 
        var collection = db.collection('preguntas');
        
        collection.count(function(err, count){
            
            collection.find({}).toArray(function(err, preguntas){
                        
                 db.close();

                 var respuesta = swig.renderFile('vistas/foro.html', {
                     preguntas: preguntas,
                     cantidad : count,
                     usuario : req.session.usuario
                 });

                 res.send(respuesta);
             });
             
        });
      }
    });
});
app.get('/login', function (req, res) {
    var respuesta = swig.renderFile('vistas/login.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/registro', function (req, res) {
    var respuesta = swig.renderFile('vistas/registro.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.post('/login', function (req, res) {
    var passwordSeguro = crypto.createHmac('sha256', secreto)
           .update(req.body.password).digest('hex');
    
   // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
        // Error
        // Para redirect un post es post/login ...
        res.redirect("/login?error=true");
      } else {
        var collection = db.collection('usuarios');
        collection.find({ email: req.body.email, password: passwordSeguro })
                .toArray(function(err, usuarios){
                    
            if (err || usuarios.length === 0) {
                // No encontrado
                res.redirect("/login?error=true");
            } else {
                // Encontrado
                req.session.usuario = usuarios[0]._id.toString();
                if ( req.session.destino !== null ){
                   res.redirect(req.session.destino);
                } else {
                   res.redirect("/foro");
                }

            }
            db.close();
        });
      }
    });
});
app.post('/usuario', function (req, res) {
    var passwordSeguro = crypto.createHmac('sha256', secreto)
       .update(req.body.password).digest('hex');


    var nuevoUsuario = { 
        nombre : req.body.nombre,
        email : req.body.email,
        password : passwordSeguro
    };
    
        // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
         res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('usuarios');
        collection.insert(nuevoUsuario, 
            function (err, result) {
                if (err) {
                  res.send("Error al insertar "+err); 
                } else {
                  res.send('Usuario Insertado '+ result);  
                }
                // Cerrar el cliente
                db.close();
            });
      }
    });

    
    
});
app.get('/foro/modificar/:id', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      console.log("Error:  "+err);
      if (err) {
        res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
                 
        var collection = db.collection('preguntas');
        var idPregunta = require('mongodb').ObjectID(req.params.id);
        
        collection.find({ _id : idPregunta }).toArray(function(err, preguntas){
             db.close();

             var respuesta = swig.renderFile('vistas/modificarPregunta.html', {
                 pregunta: preguntas[0]
             });

             res.send(respuesta);
         });
      }
    });
});
app.get('/foro/respuesta/modificar/:id', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      console.log("Error:  "+err);
      if (err) {
        res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
                 
        var collection = db.collection('respuestas');
        var idPregunta = require('mongodb').ObjectID(req.params.id);
        
        collection.find({ _id : idPregunta }).toArray(function(err, respuestas){
             db.close();

             var respuesta = swig.renderFile('vistas/modificarRespuesta.html', {
                 respues: respuestas[0]
             });

             res.send(respuesta);
         });
      }
    });
});
app.get('/foro/eliminar/:id', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
         res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('preguntas');
        
        // Transformar a Mongo ObjectID
        var id = require('mongodb').ObjectID(req.params.id);

        collection.remove({ _id : id }, function (err, result) {
            if (err) {
                var respuesta = swig.renderFile('vistas/mensaje.html', {
                    mensaje : "Problema al Eliminar la pregunta"
                });
                res.send(respuesta);
            } else {
                res.redirect("/foro");
            }
            db.close();
        });
      }
    }); 
});
app.get('/foro/respuesta/eliminar/:id', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
         res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('respuestas');
        
        // Transformar a Mongo ObjectID
        var id = require('mongodb').ObjectID(req.params.id);

        collection.remove({ _id : id }, function (err, result) {
            if (err) {
                var respuesta = swig.renderFile('vistas/mensaje.html', {
                    mensaje : "Problema al Eliminar la respuesta"
                });
                res.send(respuesta);
            } else {
                res.redirect("/foro");
            }
            db.close();
        });
      }
    }); 
});
app.post('/foro/modificar/:id', function (req, res) {
    // Datos a modificar
    var nuevosDatos = { 
        pregunta : req.body.pregunta,
        id_usuario : req.session.usuario
    };
    
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
         res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('preguntas');
        
        // Transformar a Mongo ObjectID
        var id = require('mongodb').ObjectID(req.params.id);

        collection.update({ _id : id }, {$set: nuevosDatos }, 
            function (err, result) {
                if (err) {
                    var respuesta = swig.renderFile('vistas/mensaje.html', {
                        mensaje : "Problema al modificar la pregunta"
                    });
                    res.send(respuesta);
                
                    } else {
   
					var respuesta = swig.renderFile('vistas/mensaje.html', {
						mensaje : "Su pregunta ha sido modificada con éxito. "
						
					});
					res.send(respuesta); 
                }
                db.close();
            });
      }
    }); 
});
app.post('/foro/respuesta/modificar/:id', function (req, res) {
    // Datos a modificar
    var nuevosDatos = { 
        respuesta : req.body.respuesta,
        id_usuario : req.session.usuario,
        id_pregunta : req.body.idpregunta
    };
    
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
         res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('respuestas');
        
        // Transformar a Mongo ObjectID
        var id = require('mongodb').ObjectID(req.params.id);

        collection.update({ _id : id }, {$set: nuevosDatos }, 
            function (err, result) {
                if (err) {
                    var respuesta = swig.renderFile('vistas/mensaje.html', {
                        mensaje : "Problema al modificar la respuesta"
                    });
                    res.send(respuesta);
                
                    } else {
   
					var respuesta = swig.renderFile('vistas/mensaje.html', {
						mensaje : "Su respuesta ha sido modificada con éxito. "
						
					});
					res.send(respuesta); 
                }
                db.close();
            });
      }
    }); 
});
app.post('/foro/agregar', function (req, res) {
    var nuevaPregunta = { 
        pregunta : req.body.pregunta,
        id_usuario : req.session.usuario
    };
    
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
        var respuesta = swig.renderFile('vistas/mensaje.html', {
            mensaje : "Ha ocurrido un problema al publicar la pregunta"
        });
        res.send(respuesta);

      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('preguntas');
        collection.insert(nuevaPregunta, 
            function (err, result) {
                if (err) {
                    var respuesta = swig.renderFile('vistas/mensaje.html', {
                        mensaje : "Ha ocurrido un problema al publicar la pregunta"
                    });
                    res.send(respuesta);

                } else {
   
					var respuesta = swig.renderFile('vistas/mensaje.html', {
						mensaje : "Su pregunta "+result.ops[0].pregunta +
						" ha sido publicado con éxito. Código: "
						+result.ops[0]._id
					});
					res.send(respuesta); 
                }
                db.close();
            });
      }
    }); 
});
app.post('/foro/respuesta/:id', function (req, res) {
    var nuevaRespuesta = { 
        respuesta : req.body.respuesta,
        id_usuario : req.session.usuario,
        id_pregunta : req.params.id
    };
    
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      if (err) {
        var respuesta = swig.renderFile('vistas/mensaje.html', {
            mensaje : "Ha ocurrido un problema al publicar la pregunta"
        });
        res.send(respuesta);

      } else {
        console.log("Conectado al servidor");
    
        var collection = db.collection('respuestas');
        collection.insert(nuevaRespuesta, 
            function (err, result) {
                if (err) {
                    var respuesta = swig.renderFile('vistas/mensaje.html', {
                        mensaje : "Ha ocurrido un problema al publicar la respuesta"
                    });
                    res.send(respuesta);

                } else {
   
					var respuesta = swig.renderFile('vistas/mensaje.html', {
						mensaje : "Su pregunta "+result.ops[0].respuesta +
						" ha sido publicado con éxito. Código: "
						+result.ops[0]._id
					});
					res.send(respuesta); 
                }
                db.close();
            });
      }
    }); 
});

app.get('/foro/agregar', function (req, res) {
    var respuesta = swig.renderFile('vistas/agregarPregunta.html', {
        error : req.query.error
    });
    res.send(respuesta);
});
app.get('/foro/respuesta/:id', function (req, res) {
    var respuesta = swig.renderFile('vistas/agregarRespuesta.html', {
        error : req.query.error,
        idpregunta : req.params.id
    });
    res.send(respuesta);
});

app.get('/foro/respuestas/:id', function (req, res) {
    // Abrir el cliente
    MongoClient.connect('mongodb://panamericano:itf1234@ds121135.mlab.com:21135/panamericano', 
    function(err, db) {
      console.log("Error:  "+err);
      if (err) {
        res.send("Error de conexión: "+err);
      } else {
        console.log("Conectado al servidor");
                 
        var collection = db.collection('respuestas');
        
        
        collection.count(function(err, count){
            
            collection.find({ id_pregunta : req.params.id}).toArray(function(err, respuestas){
                        
                 db.close();
                 var url = 'vistas/respuestas.html';
                 var respuesta = swig.renderFile(url, {
                     respuestas: respuestas,
                     cantidad : count,
                     usuario : req.session.usuario,
                     idpregunta : req.params.id,
                     pregunta : pregunta
                 });

                 res.send(respuesta);
             });
             
        });
      }
    });
});
app.get('/logout', function (req, res) {
    req.session.usuario = null;
    res.redirect("/foro");
});
var server = app.listen(3000, function () {
	  console.log('Servidor ejecutandose en localhost:3000');
});