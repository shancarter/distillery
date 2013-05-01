;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
var topojson = require("topojson");

window.topojson = topojson;

console.log(this, topojson);

},{"topojson":2}],2:[function(require,module,exports){
var fs = require("fs");

var topojson = module.exports = require("./topojson");
topojson.topology = require("./lib/topojson/topology");
topojson.simplify = require("./lib/topojson/simplify");
topojson.filter = require("./lib/topojson/filter");
topojson.bind = require("./lib/topojson/bind");

},{"fs":3,"./topojson":4,"./lib/topojson/topology":5,"./lib/topojson/simplify":6,"./lib/topojson/filter":7,"./lib/topojson/bind":8}],3:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],4:[function(require,module,exports){
module.exports = (function() {

  function merge(topology, arcs) {
    var arcsByEnd = {},
        fragmentByStart = {},
        fragmentByEnd = {};

    arcs.forEach(function(i) {
      var e = ends(i);
      (arcsByEnd[e[0]] || (arcsByEnd[e[0]] = [])).push(i);
      (arcsByEnd[e[1]] || (arcsByEnd[e[1]] = [])).push(~i);
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else if (g = fragmentByEnd[end]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else if (g = fragmentByStart[start]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);
          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[start]) {
        delete fragmentByStart[f.start];
        f.unshift(~i);
        f.start = end;
        if (g = fragmentByEnd[end]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);
          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByEnd[end]) {
        delete fragmentByEnd[f.end];
        f.push(~i);
        f.end = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else if (g = fragmentByStart[start]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];
      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      return [p0, p1];
    }

    var fragments = [];
    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);
    return fragments;
  }

  function mesh(topology, o, filter) {
    var arcs = [];

    if (arguments.length > 1) {
      var geomsByArc = [],
          geom;

      function arc(i) {
        if (i < 0) i = ~i;
        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);
      }

      function line(arcs) {
        arcs.forEach(arc);
      }

      function polygon(arcs) {
        arcs.forEach(line);
      }

      function geometry(o) {
        if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
        else if (o.type in geometryType) {
          geom = o;
          geometryType[o.type](o.arcs);
        }
      }

      var geometryType = {
        LineString: line,
        MultiLineString: polygon,
        Polygon: polygon,
        MultiPolygon: function(arcs) { arcs.forEach(polygon); }
      };

      geometry(o);

      geomsByArc.forEach(arguments.length < 3
          ? function(geoms, i) { arcs.push([i]); }
          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push([i]); });
    } else {
      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push([i]);
    }

    return object(topology, {type: "MultiLineString", arcs: merge(topology, arcs)});
  }

  function featureOrCollection(topology, o) {
    return o.type === "GeometryCollection" ? {
      type: "FeatureCollection",
      features: o.geometries.map(function(o) { return feature(topology, o); })
    } : feature(topology, o);
  }

  function feature(topology, o) {
    var f = {
      type: "Feature",
      id: o.id,
      properties: o.properties || {},
      geometry: object(topology, o)
    };
    if (o.id == null) delete f.id;
    return f;
  }

  function object(topology, o) {
    var tf = topology.transform,
        kx = tf.scale[0],
        ky = tf.scale[1],
        dx = tf.translate[0],
        dy = tf.translate[1],
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, x = 0, y = 0, p; k < n; ++k) points.push([
        (x += (p = a[k])[0]) * kx + dx,
        (y += p[1]) * ky + dy
      ]);
      if (i < 0) reverse(points, n);
    }

    function point(coordinates) {
      return [coordinates[0] * kx + dx, coordinates[1] * ky + dy];
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0]);
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0]);
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var t = o.type;
      return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
          : null;
    }

    var geometryType = {
      Point: function(o) { return point(o.coordinates); },
      MultiPoint: function(o) { return o.coordinates.map(point); },
      LineString: function(o) { return line(o.arcs); },
      MultiLineString: function(o) { return o.arcs.map(line); },
      Polygon: function(o) { return polygon(o.arcs); },
      MultiPolygon: function(o) { return o.arcs.map(polygon); }
    };

    return geometry(o);
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function neighbors(objects) {
    var objectsByArc = [],
        neighbors = objects.map(function() { return []; });

    function line(arcs, i) {
      arcs.forEach(function(a) {
        if (a < 0) a = ~a;
        var o = objectsByArc[a] || (objectsByArc[a] = []);
        if (!o[i]) o.forEach(function(j) {
          var n, k;
          k = bisect(n = neighbors[i], j); if (n[k] !== j) n.splice(k, 0, j);
          k = bisect(n = neighbors[j], i); if (n[k] !== i) n.splice(k, 0, i);
        }), o[i] = i;
      });
    }

    function polygon(arcs, i) {
      arcs.forEach(function(arc) { line(arc, i); });
    }

    function geometry(o, i) {
      if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
    }

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
    };

    objects.forEach(geometry);
    return neighbors;
  }

  return {
    version: "1.0.0",
    mesh: mesh,
    feature: featureOrCollection,
    neighbors: neighbors
  };
})();

},{}],5:[function(require,module,exports){
var type = require("./type"),
    systems = require("./coordinate-systems");

var ε = 1e-6;

module.exports = function(objects, options) {
  var Q = 1e4, // precision of quantization
      id = function(d) { return d.id; }, // function to compute object id
      propertyTransform = function() {}, // function to transform properties
      stitchPoles = true,
      verbose = false,
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity,
      kx,
      ky,
      εmax = 0,
      coincidences = [],
      system = null,
      arcs = [],
      arcsByIndex = [],
      pointsByIndex = [];

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]),
    "stitch-poles" in options && (stitchPoles = !!options["stitch-poles"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "quantization" in options && (Q = +options["quantization"]),
    "id" in options && (id = options["id"]),
    "property-transform" in options && (propertyTransform = options["property-transform"]);

  function each(callback) {
    var t = type(callback), o = {};
    for (var k in objects) o[k] = t.object(objects[k]) || {};
    return o;
  }

  // Compute bounding box.
  each({
    point: function(point) {
      var x = point[0],
          y = point[1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  });

  // For automatic coordinate system determination, consider the bounding box.
  var oversize = x0 < -180 - ε || x1 > 180 + ε || y0 < -90 - ε || y1 > 90 + ε;
  if (!system) { system = systems[oversize ? "cartesian" : "spherical"]; if (options) options["coordinate-system"] = system.name; }
  if (system === systems.spherical && oversize) throw new Error("spherical coordinates outside of [±180°, ±90°]");

  // Remove polar antimeridian cuts, i.e. all sequences:
  // [±180°, *]+, [*, ±90°]+, [±180, *]+.
  if (system === systems.spherical && stitchPoles) {
    each({
      polygon: function(polygon) {
        for (var j = 0, m = polygon.length; j < m; ++j) {
          var line = polygon[j],
              i = -1,
              n = line.length,
              a = false,
              b = false,
              c = false,
              i0 = -1;
          for (i = 0; i < n; ++i) {
            var point = line[i],
                antimeridian = Math.abs(Math.abs(point[0]) - 180) < 1e-2,
                polar = Math.abs(Math.abs(point[1]) - 90) < 1e-2;
            if (antimeridian || polar) {
              if (!(a || b || c)) i0 = i;
              if (antimeridian) {
                if (a) c = true;
                else a = true;
              }
              if (polar) b = true;
            }
            if (!antimeridian && !polar || i === n - 1) {
              if (a && b && c) {
                if (verbose) console.warn("stitch: removed polar cut [" + line[i0] + "] … [" + line[i] + "]");
                var spliced = line.splice(i0, i - i0);
                n -= i - i0;
                i = i0;
              }
              a = b = c = false;
            }
          }
        }
      }
    });

    // Recompute bounding box.
    x1 = y1 = -(x0 = y0 = Infinity);
    each({
      point: function(point) {
        var x = point[0],
            y = point[1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    });

    // When near the spherical coordinate limits, clamp to nice round values.
    // This avoids quantized coordinates that are slightly outside the limits.
    if (x0 < -180 + ε) x0 = -180;
    if (x1 > 180 - ε) x1 = 180;
    if (y0 < -90 + ε) y0 = -90;
    if (y1 > 90 - ε) y1 = 90;
  }

  // Compute quantization scaling factors.
  if (Q) {
    kx = x1 - x0 ? (Q - 1) / (x1 - x0) : 1;
    ky = y1 - y0 ? (Q - 1) / (y1 - y0) : 1;
  } else {
    console.warn("quantization: disabled; assuming inputs already quantized");
    Q = x1 + 1;
    kx = ky = 1;
    x0 = y0 = 0;
  }

  if (verbose) {
    var qx0 = quantizeX(x0) * (1 / kx) + x0,
        qx1 = quantizeX(x1) * (1 / kx) + x0,
        qy0 = quantizeY(y0) * (1 / ky) + y0,
        qy1 = quantizeY(y1) * (1 / ky) + y0;
    console.warn("quantization: bounds " + [qx0, qy0, qx1, qy1].join(" ") + " (" + system.name + ")");
  }

  //
  each({
    line: function(line) {
      var i = -1,
          n = line.length,
          a = [];
      while (++i < n) {
        var point = line[i],
            x1 = point[0],
            y1 = point[1],
            x = quantizeX(x1),
            y = quantizeY(y1),
            j = y * Q + x,
            ε = system.distance(x1, y1, x / kx + x0, y / ky + y0);
        if (ε > εmax) εmax = ε;
        if (!a[j]) {
          if (coincidences[j]) coincidences[j].push(line);
          else coincidences[j] = [line];
          a[j] = 1;
        }
      }
    }
  });

  if (verbose) console.warn("quantization: maximum error "  + system.formatDistance(εmax));

  // Convert features to geometries, and stitch together arcs.
  objects = each({
    Feature: function(feature) {
      var geometry = feature.geometry;
      if (feature.geometry == null) geometry = {};
      if ("id" in feature) geometry.id = feature.id;
      if ("properties" in feature) geometry.properties = feature.properties;
      return this.geometry(geometry);
    },

    FeatureCollection: function(collection) {
      collection.type = "GeometryCollection";
      collection.geometries = collection.features.map(this.Feature, this);
      delete collection.features;
      return collection;
    },

    GeometryCollection: function(collection) {
      collection.geometries = collection.geometries.map(this.geometry, this);
    },

    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.coordinates.map(function(polygon) { return polygon.map(lineClosed); });
    },

    Polygon: function(polygon) {
      polygon.arcs = polygon.coordinates.map(lineClosed);
    },

    MultiLineString: function(multiLineString) {
      multiLineString.arcs = multiLineString.coordinates.map(lineOpen);
    },

    LineString: function(lineString) {
      lineString.arcs = lineOpen(lineString.coordinates);
    },

    MultiPoint: function(multiPoint) {
      multiPoint.coordinates = multiPoint.coordinates.map(quantize);
    },

    Point: function(point) {
      point.coordinates = quantize(point.coordinates);
    },

    geometry: function(geometry) {
      if (geometry == null) geometry = {};
      else this.defaults.geometry.call(this, geometry);

      geometry.id = id(geometry);
      if (geometry.id == null) delete geometry.id;

      if (properties0 = geometry.properties) {
        var properties0, properties1 = {}, key0, key1;
        delete geometry.properties;
        for (var key0 in properties0) {
          if (propertyTransform(properties1, key0, properties0[key0])) {
            geometry.properties = properties1;
          }
        }
      }

      if (geometry.arcs) delete geometry.coordinates;
      return geometry;
    }
  });

  function quantize(coordinates) {
    return [quantizeX(coordinates[0]), quantizeY(coordinates[1])];
  }

  function quantizeX(x) {
    return Math.round((x - x0) * kx);
  }

  function quantizeY(y) {
    return Math.round((y - y0) * ky);
  }

  function lineClosed(points) {
    return line(points, false);
  }

  function lineOpen(points) {
    return line(points, true);
  }

  function line(points, open) {
    var lineArcs = [],
        n = points.length,
        a = [],
        k = 0,
        p;

    // For closed lines, rotate to find a suitable shared starting point.
    for (; k < n; ++k) {
      var point = points[k],
          x = quantizeX(point[0]),
          y = quantizeY(point[1]),
          j = y * Q + x,
          t = coincidences[j];
      if (open) break;
      if (p && !equal(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP && !pInT) --k;
        break;
      }
      p = t;
    }

    // If no shared starting point is found for closed lines, rotate to minimum.
    if (k === n && p.length > 1) {
      for (k = 0, i = 1; i < n; ++i) {
        var point = points[i],
            m = quantizeY(point[1]) * Q + quantizeX(point[0]);
        if (m < j) j = m, k = i;
      }
    }

    if (n) for (var i = 0, m = open ? n : n + 1; i < m; ++i) {
      var point = points[(i + k) % n],
          x = quantizeX(point[0]),
          y = quantizeY(point[1]),
          j = y * Q + x,
          p = coincidences[j];
      if (!equal(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP) a.push(j);
        arc(a);
        if (!tInP && !pInT) arc([a[a.length - 1], j]);
        if (pInT) a = [a[a.length - 1]];
        else a = [];
      }
      if (a[a.length - 1] !== j) a.push(j); // skip duplicate points
      t = p;
    }

    arc(a, true);

    function arc(a, last) {
      var n = a.length;

      if (last && !lineArcs.length && n === 1) {
        var index = a[0];
        if (index in pointsByIndex) {
          lineArcs.push(pointsByIndex[index]);
        } else {
          lineArcs.push(pointsByIndex[index] = arcs.length);
          arcs.push(a);
        }
      } else if (n > 1) {
        var index = Math.min(a[0], a[n - 1]),
            indexArcs = arcsByIndex[index];

        if (indexArcs) {
          if (indexArcs.some(matchForward)) return;
          if (indexArcs.some(matchBackward)) return;
          indexArcs.push(a);
        } else {
          arcsByIndex[index] = [a];
        }

        lineArcs.push(a.index = arcs.length);
        arcs.push(a);
      }

      function matchForward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (a[i] !== b[i]) return false;
        lineArcs.push(b.index);
        return true;
      }

      function matchBackward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (a[i] !== b[n - i - 1]) return false;
        lineArcs.push(~b.index);
        return true;
      }
    }

    return lineArcs;
  }

  return {
    type: "Topology",
    transform: {
      scale: [1 / kx, 1 / ky],
      translate: [x0, y0]
    },
    objects: objects,
    arcs: arcs.map(function(arc) {
      var y0 = 0,
          x0 = 0;
      return arc.map(function(index) {
        var y1 = index / Q | 0,
            x1 = index - y1 * Q,
            dx = x1 - x0,
            dy = y1 - y0;
        x0 = x1;
        y0 = y1;
        return [dx, dy];
      });
    })
  };
};

function equal(a, b) {
  var n = a.length, i = -1;
  if (b.length !== n) return false;
  while (++i < n) if (a[i] !== b[i]) return false;
  return true;
}

},{"./type":9,"./coordinate-systems":10}],6:[function(require,module,exports){
var minHeap = require("./min-heap"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var mininumArea = 0,
      retainProportion,
      verbose = false,
      heap = minHeap(),
      maxArea = 0,
      system = null,
      triangle,
      N = 0,
      M = 0;

  if (options)
    "minimum-area" in options && (mininumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "retain-proportion" in options && (retainProportion = +options["retain-proportion"]),
    "verbose" in options && (verbose = !!options["verbose"]);

  topology.arcs.forEach(function(arc) {
    var triangles = [];

    arc.forEach(transformAbsolute(topology.transform));

    for (var i = 1, n = arc.length - 1; i < n; ++i) {
      triangle = arc.slice(i - 1, i + 2);
      triangle[1].area = system.triangleArea(triangle);
      triangles.push(triangle);
      heap.push(triangle);
    }

    // Always keep the arc endpoints!
    arc[0].area = arc[n].area = Infinity;

    N += n + 1;

    for (var i = 0, n = triangles.length; i < n; ++i) {
      triangle = triangles[i];
      triangle.previous = triangles[i - 1];
      triangle.next = triangles[i + 1];
    }
  });

  while (triangle = heap.pop()) {
    var previous = triangle.previous,
        next = triangle.next;

    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latter's area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1].area < maxArea) triangle[1].area = maxArea;
    else maxArea = triangle[1].area;

    if (previous) {
      previous.next = next;
      previous[2] = triangle[2];
      update(previous);
    }

    if (next) {
      next.previous = previous;
      next[0] = triangle[0];
      update(next);
    }
  }

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point.area);
      });
    });
    mininumArea = areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)];
    if (verbose) console.warn("simplification: effective minimum area " + mininumArea.toPrecision(3));
  }

  topology.arcs = topology.arcs.map(function(arc) {
    return arc.filter(function(point) {
      return point.area >= mininumArea;
    });
  });

  topology.arcs.forEach(function(arc) {
    arc.forEach(transformRelative(topology.transform));
    M += arc.length;
  });

  function update(triangle) {
    heap.remove(triangle);
    triangle[1].area = system.triangleArea(triangle);
    heap.push(triangle);
  }

  if (verbose) console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");

  return topology;
};

function transformAbsolute(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point, i) {
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function transformRelative(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point, i) {
    var x1 = (point[0] - dx) / kx | 0,
        y1 = (point[1] - dy) / ky | 0;
    point[0] = x1 - x0;
    point[1] = y1 - y0;
    x0 = x1;
    y0 = y1;
  };
}

},{"./min-heap":11,"./coordinate-systems":10}],9:[function(require,module,exports){
module.exports = function(types) {
  for (var type in typeDefaults) {
    if (!(type in types)) {
      types[type] = typeDefaults[type];
    }
  }
  types.defaults = typeDefaults;
  return types;
};

var typeDefaults = {

  Feature: function(feature) {
    if (feature.geometry) this.geometry(feature.geometry);
  },

  FeatureCollection: function(collection) {
    var features = collection.features, i = -1, n = features.length;
    while (++i < n) this.Feature(features[i]);
  },

  GeometryCollection: function(collection) {
    var geometries = collection.geometries, i = -1, n = geometries.length;
    while (++i < n) this.geometry(geometries[i]);
  },

  LineString: function(lineString) {
    this.line(lineString.coordinates);
  },

  MultiLineString: function(multiLineString) {
    var coordinates = multiLineString.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  },

  MultiPoint: function(multiPoint) {
    var coordinates = multiPoint.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  MultiPolygon: function(multiPolygon) {
    var coordinates = multiPolygon.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.polygon(coordinates[i]);
  },

  Point: function(point) {
    this.point(point.coordinates);
  },

  Polygon: function(polygon) {
    this.polygon(polygon.coordinates);
  },

  object: function(object) {
    return object == null ? null
        : typeObjects.hasOwnProperty(object.type) ? this[object.type](object)
        : this.geometry(object);
  },

  geometry: function(geometry) {
    return geometry == null ? null
        : typeGeometries.hasOwnProperty(geometry.type) ? this[geometry.type](geometry)
        : null;
  },

  point: function() {},

  line: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  polygon: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  }
};

var typeGeometries = {
  LineString: 1,
  MultiLineString: 1,
  MultiPoint: 1,
  MultiPolygon: 1,
  Point: 1,
  Polygon: 1,
  GeometryCollection: 1
};

var typeObjects = {
  Feature: 1,
  FeatureCollection: 1
};

},{}],11:[function(require,module,exports){
module.exports = function() {
  var heap = {},
      array = [];

  heap.push = function() {
    for (var i = 0, n = arguments.length; i < n; ++i) {
      var object = arguments[i];
      up(object.index = array.push(object) - 1);
    }
    return array.length;
  };

  heap.pop = function() {
    var removed = array[0],
        object = array.pop();
    if (array.length) {
      array[object.index = 0] = object;
      down(0);
    }
    return removed;
  };

  heap.remove = function(removed) {
    var i = removed.index,
        object = array.pop();
    if (i !== array.length) {
      array[object.index = i] = object;
      (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
  };

  function up(i) {
    var object = array[i];
    while (i > 0) {
      var up = ((i + 1) >> 1) - 1,
          parent = array[up];
      if (compare(object, parent) >= 0) break;
      array[parent.index = i] = parent;
      array[object.index = i = up] = object;
    }
  }

  function down(i) {
    var object = array[i];
    while (true) {
      var right = (i + 1) << 1,
          left = right - 1,
          down = i,
          child = array[down];
      if (left < array.length && compare(array[left], child) < 0) child = array[down = left];
      if (right < array.length && compare(array[right], child) < 0) child = array[down = right];
      if (down === i) break;
      array[child.index = i] = child;
      array[object.index = i = down] = object;
    }
  }

  return heap;
};

function compare(a, b) {
  return a[1].area - b[1].area;
}

},{}],10:[function(require,module,exports){
module.exports = {
  cartesian: require("./cartesian"),
  spherical: require("./spherical")
};

},{"./cartesian":12,"./spherical":13}],7:[function(require,module,exports){
var type = require("./type"),
    prune = require("./prune"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var minimumArea = 0,
      system = null,
      clockwise = true; // force exterior rings to be clockwise?

  if (options)
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "force-clockwise" in options && (clockwise = !!options["force-clockwise"]);

  var filter = type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) {
      var arcs = polygon.arcs,
          a = ringArea(arcs[0]);
      if (a < 0) {
        if (clockwise) {
          reverse(arcs[0]);
          a = -a;
        } else {
          a += 4 * Math.PI;
        }
      }
      if (a <= minimumArea) {
        polygon.type = null;
        delete polygon.arcs;
      } else if (clockwise) {
        filterHoles(arcs);
      }
    },
    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.arcs.filter(function(polygon) {
        var a = ringArea(polygon[0]);
        if (a < 0) {
          if (clockwise) {
            reverse(polygon[0]);
            a = -a;
          } else {
            a += 4 * Math.PI;
          }
        }
        if (a > minimumArea) {
          if (clockwise) filterHoles(polygon);
          return true;
        }
      });
    }
  });

  for (var key in topology.objects) {
    filter.object(topology.objects[key]);
  }

  prune(topology, options);

  function filterHoles(rings) {
    for (var i = 1, n = rings.length, r; i < n; ++i) {
      if (ringArea(r = rings[i]) > 0) reverse(r);
    }
  }

  function ringArea(ring) {
    return system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]);
  }
};

// TODO It might be slightly more compact to reverse the arc.
function reverse(ring) {
  var i = -1, n = ring.length;
  ring.reverse();
  while (++i < n) ring[i] = ~ring[i];
}

function noop() {}

},{"./type":9,"./prune":14,"./coordinate-systems":10,"../../":2}],8:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, propertieById) {
  var bind = type({
    geometry: function(geometry) {
      var properties0 = geometry.properties,
          properties1 = propertieById[geometry.id];
      if (properties1) {
        if (properties0) for (var k in properties1) properties0[k] = properties1[k];
        else for (var k in properties1) { geometry.properties = properties1; break; }
      }
      this.defaults.geometry.call(this, geometry);
    },
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: noop,
    MultiPolygon: noop
  });

  for (var key in topology.objects) {
    bind.object(topology.objects[key]);
  }
};

function noop() {}

},{"./type":9,"../../":2}],12:[function(require,module,exports){
exports.name = "cartesian";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.triangleArea = triangleArea;
exports.distance = distance;

function formatDistance(d) {
  return d.toString();
}

function ringArea(ring) {
  var i = 0,
      n = ring.length,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) {
    area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  }
  return area * .5;
}

function triangleArea(triangle) {
  return Math.abs(
    (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])
    - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])
  );
}

function distance(x0, y0, x1, y1) {
  var dx = x0 - x1, dy = y0 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

},{}],13:[function(require,module,exports){
var π = Math.PI,
    π_4 = π / 4,
    radians = π / 180;

exports.name = "spherical";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.triangleArea = triangleArea;
exports.distance = haversinDistance; // XXX why two implementations?

function formatDistance(radians) {
  var km = radians * 6371;
  return (km > 1 ? km.toFixed(3) + "km" : (km * 1000).toPrecision(3) + "m")
      + " (" + (radians * 180 / Math.PI).toPrecision(3) + "°)";
}

function ringArea(ring) {
  if (!ring.length) return 0;
  var u = 1,
      v = 0,
      p = ring[0],
      λ = p[0] * radians,
      φ = p[1] * radians / 2 + π_4,
      λ0 = λ,
      cosφ0 = Math.cos(φ),
      sinφ0 = Math.sin(φ);

  for (var i = 1, n = ring.length; i < n; ++i) {
    p = ring[i], λ = p[0] * radians, φ = p[1] * radians / 2 + π_4;

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u0 = u,
        v0 = v,
        u1 = cosφ0 * cosφ + k * Math.cos(dλ),
        v1 = k * Math.sin(dλ);
    // ∑ arg(z) = arg(∏ z), where z = u + iv.
    u = u0 * u1 - v0 * v1;
    v = v0 * u1 + u0 * v1;

    // Advance the previous point.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  return 2 * Math.atan2(v, u);
}

function triangleArea(t) {
  var a = distance(t[0], t[1]),
      b = distance(t[1], t[2]),
      c = distance(t[2], t[0]),
      s = (a + b + c) / 2;
  return 4 * Math.atan(Math.sqrt(Math.max(0, Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2))));
}

function distance(a, b) {
  var Δλ = (b[0] - a[0]) * radians,
      sinΔλ = Math.sin(Δλ),
      cosΔλ = Math.cos(Δλ),
      sinφ0 = Math.sin(a[1] * radians),
      cosφ0 = Math.cos(a[1] * radians),
      sinφ1 = Math.sin(b[1] * radians),
      cosφ1 = Math.cos(b[1] * radians),
      _;
  return Math.atan2(Math.sqrt((_ = cosφ1 * sinΔλ) * _ + (_ = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * _), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
}

function haversinDistance(x0, y0, x1, y1) {
  x0 *= radians, y0 *= radians, x1 *= radians, y1 *= radians;
  return 2 * Math.asin(Math.sqrt(haversin(y1 - y0) + Math.cos(y0) * Math.cos(y1) * haversin(x1 - x0)));
}

function haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

},{}],14:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var verbose = false,
      retained = [],
      j = -1,
      n = topology.arcs.length;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  var prune = type({
    LineString: function(lineString) {
      this.line(lineString.arcs);
    },
    MultiLineString: function(multiLineString) {
      var arcs = multiLineString.arcs, i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    },
    MultiPoint: noop,
    MultiPolygon: function(multiPolygon) {
      var arcs = multiPolygon.arcs, i = -1, n = arcs.length;
      while (++i < n) this.polygon(arcs[i]);
    },
    Point: noop,
    Polygon: function(polygon) {
      this.polygon(polygon.arcs);
    },
    line: function(arcs) {
      var i = -1, n = arcs.length, arc, reversed;
      while (++i < n) {
        arc = arcs[i];
        if (reversed = arc < 0) arc = ~arc;
        if (retained[arc] == null) retained[arc] = ++j, arc = j;
        else arc = retained[arc];
        arcs[i] = reversed ? ~arc : arc;
      }
    },
    polygon: function(arcs) {
      var i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    }
  });

  for (var key in topology.objects) {
    prune.object(topology.objects[key]);
  }

  if (verbose) console.warn("prune: retained " + (j + 1) + " / " + n + " arcs (" + Math.round((j + 1) / n * 100) + "%)");

  var arcs = [];
  retained.forEach(function(i, j) { arcs[i] = topology.arcs[j]; });
  topology.arcs = arcs;
};

function noop() {}

},{"./type":9,"../../":2}]},{},[1])
;