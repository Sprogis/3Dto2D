const uuidv4 = require('uuid/v4');
const express = require('express');
const app = express();
const formidable = require('formidable');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const fs = require('fs');
const path = require('path');
app.use(express.static('public'));
app.set('etag', false);
app.disable('view cache');
let directory = './public/uploads/textures';
let directory2 = './public/uploads';
app.use(session({
    genid: function(req) {
      return uuidv4(); // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: false
  }))

app.post('/submit-form', async function (req, res){

    

    const meme = await new Promise(async function (resolve, reject){

        fs.mkdirSync(directory, {recursive: true});

        fs.readdir(directory, (err, files) => {
            if (err) throw err;
        
            for (const file of files) {
                if(!fs.statSync(path.join(directory, file)).isDirectory()){
                    fs.unlinkSync(path.join(directory, file));
                    console.log("Deleted " + file);
                }
            }
            
        });
        fs.readdir(directory2, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                if(!fs.statSync(path.join(directory2, file)).isDirectory()){
                    fs.unlinkSync(path.join(directory2, file));
                    console.log("Deleted " + file);
                }
                resolve("nais");
            }
        });
    });

    console.log(meme);
    if(meme == "nais"){
        let meme2 = await new Promise(async function (resolve, reject){
        var form = new formidable.IncomingForm();

        form.parse(req);

        form.on('fileBegin', function (name, file){
            console.log("Begun receving " + file.name);
            let path = file.name.split('/');
            if(path[path.length-1] == "scene.bin" || path[path.length-1] == "scene.gltf"){
                
                file.path = __dirname + '/public/uploads/id=' + req.session.id + '/' + path[path.length-1];
            }
            else if(path[path.length-2] == "textures"){
                file.path = __dirname + '/public/uploads/id=' + req.session.id + '/textures/' + path[path.length-1];
            }
        });

        form.on('file', function (name, file){
            console.log('Uploaded ' + file.name);

        });

        form.on('error', function(err) {
            console.log('failed to upload');
            reject("bajs2");
        });

        form.on('end', function() {
            resolve("done");
        });
    });
    console.log(meme2);
    res.redirect('/');
}
});


app.get('/', function(req, res){
    if(req.session.page_views){
        req.session.page_views++;
        //res.send("You visited this page " + req.session.page_views + " times");
        console.log(req.session.id);
     } else {
        req.session.page_views = 1;
        directory = './public/uploads/id=' + req.session.id + '/textures';
        directory2 = './public/uploads/id=' + req.session.id;
        //session.id = session.genid(req);
        console.log(req.session.id);
        res.cookie('id', req.session.id);
        //res.send("Welcome to this page for the first time!");
     }
    console.log("wow");
    res.sendFile(__dirname + '/index.html');
})

app.get('/app', function(req, res){
    res.sendFile(__dirname + '/app.js');
})

app.listen(8080, () => 
  console.log(`App is listening on port ${8080}.`)  
)
