# CODIGOFUENTE
## Un código fuente

[![N|Solid](https://www.jotace.cl/assets/media/img/logo.png)](https://www.jotace.cl/blog/trascender-una-red-personal-y-privada)

## Requisitos previos

| PROGRAMA | URL | DESCRIPCION |
| ------ | ------ | ------ |
|nodejs| https://nodejs.org/es/ | programa para ejecutar códigos fuentes desarrollados en un lenguaje de programación llamado javascript |
|mongodb| https://www.mongodb.com/es | programa para guardar datos, utiliza json como estructura de datos  |
|git| https://git-scm.com/ | programa para gestionar un código fuente  |

## Pasos

Abrir consola de comandos en alguna carpeta deseada para el propósito y ejecutar el siguiente comando
```sh
git clone https://www.github.com/jotacalderon90/codigofuente
```
Este comando ejecuta el programa git y hace que clone el contenido de dicha url, el contenido es un código fuente.
Luego de clonar el código fuente y en la misma consola, ingresar a la carpeta con el siguiente comando
```sh
cd codigofuente
```
change directory, código unix para cambiarse de directorio, una vez entrado en la carpeta ejecutar el siguiente comando
```sh
npm install
```
npm es un subprograma dentro de nodejs.
esto descargará todas las dependencias que el programa necesita para hacer funcionar el servidor/backend.
las dependencias son otros códigos fuentes y se quedaran alojados en la carpeta node_modules
una vez descargada todas las dependencias del servidor ejecutar el siguiente comando
```sh
bower install
```
habrá un error porque no se hemos instalado bower, para instalar ejecutar el siguiente comando
```sh
npm install bower -g
```
esto instalara de manera global en la computadora el subprograma de nodejs llamado bower
una vez instalado volver a ejecutar el comando anterior
```sh
bower install
```
este programa permite descargar las dependencias que el programa necesita para hacer funcionar el cliente/frontend
las dependencias son otros códigos fuentes y se quedaran alojados en la carpeta frontend/assets/bower_components
una vez descargada todas las dependencias del cliente vamos a levantar el sistema
```sh
node app
```
este comando le dice a nodejs que ejecute el archivo app.js
la consola comenzará arrojar una serie de mensajes las cuales tienen por orden
- importar dependencias del backend
- configurar datos por defecto de la aplicación
- configurar servidor web
- importar dependencias internas
- conectarse con la base de datos mongodb
- configurar usuario root con un correo y contraseña (solo la primera vez)
- configurar archivos del frontend
- configurar carpetas del frontend
- configurar servicios rest (puente entre servidor/backend y el cliente/frontend)
- configurar redireccionamientos y pagina de error (404)
- levantar servidor web en puerto 80

la consola debe quedar abierta, ella mostrará todos los mensajes que se han programados para ello. A continuación abrir un navegador web preferentemente "firefox developer edition" y abrir una de las siguientes direcciones:

- localhost
- http://localhost
- http://localhost:80
- http://127.0.0.1/
- http://127.0.0.1:80

si te abre la pagina inicial es porque has hecho todo bien y por ende estas listo para comenzar a entender como funciona un programa desde su código fuente hasta su ejecución. Los siguientes pasos aún no están documentados, cualquier consulta visite mi sitio web

https://www.jotace.cl

## Resumen de conceptos
- nodejs | plataforma para ejecutar códigos fuentes
- javascript | lenguaje de programación
- mongodb | motor de base de datos
- json | estructura de datos
- git | administrador de códigos fuentes
- github | red social de programadores
- npm | subprograma de nodejs
- bower | subprograma de nodejs
- backend | código del servidor, privado, no se ve desde la web
- frontend  | código del cliente, publico, se descarga a travez del navegador web
- firefox developer edition | navegador web utilizado por programadores

## Licencia

MIT

**Software libre, yea yea!**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [jotace]: <https://www.jotace.cl>
   [mi git]: <https://github.com/jotacalderon90/>
   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>