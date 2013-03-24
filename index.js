var topojson = require("topojson");

var txt = document.createTextNode("Hello World");
document.body.appendChild(txt);

console.log(this, topojson)