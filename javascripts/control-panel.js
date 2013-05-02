// -o, --out output TopoJSON file name
// -q, --quantization maximum number of differentiable points along either dimension
// -s, --simplify precision threshold for Visvalingam simplification, in steradians
// --simplify-proportion proportion of points to retain for Visvalingam simplification
// --cartesian assume Cartesian coordinates
// --spherical assume spherical coordinates
// --force-clockwise force clockwise exterior rings and counterclockwise interior rings
// --id-property name of feature property to promote to geometry id
// -p, --properties feature properties to preserve; no name preserves all properties
// -e, --external-properties CSV or TSV file to join properties (by id) to output features
// --shapefile-encoding character encoding for reading shapefile properties
// -x, --longitude name of the longitude property for CSV or TSV geometry input
// -y, --latitude name of the latitude property for CSV or TSV geometry input


//   <span class="opts">--quantization <span class="value">1e4</span></span>
  // <span class="opts">--simplify <span class="value">0</span></span>
function controlPanel(container, argv, callback) {
  var f = d3.format(",");

  container.selectAll(".option")
      .data(d3.entries(argv))
    .enter().append("span")
      .attr("class", "option")
      .text(function(d) { return "--" + d.key; })
    .append("input")
      .attr("class", "value")
      .property("value", function(d) { return d.value; })
      .on("keyup", function(){
        var key = d3.select(this).data()[0].key;
        console.log(key)
        argv[key] = +this.value;
        callback();
      });
}