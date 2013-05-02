
d3.selectAll("input[type='range']").each(function() {
  var container = d3.select(document.createElement("div")),
      event = d3.dispatch("change"),
      box = this.getBoundingClientRect();

  var min = +this.getAttribute("min"),
      max = +this.getAttribute("max"),
      step = +this.getAttribute("step"),
      value = +this.getAttribute("value");

  container
      .attr("class", this.getAttribute("class")) // preserve attrs
      .attr("min", min)
      .attr("max", max)
      .attr("value", value)
      .attr("step", step)
      .style("display", "inline-block")
      .style("position", "relative")
      .style("width", box.width + "px")
      .style("height", box.height + "px");

  container.node().addEventListener = function(type, listener) {
    event.on(type, listener);
  };

  //public
  var handleWidth              = 12,
      handleTopOffset          = 7,
      handleSideOffset         = 4,
      tickLabelWidth           = 50,
      trackHeight              = 4,
      trackMargin              = 4,
      tickHeight               = 5,
      trackWidth               = box.width - handleWidth - trackMargin * 2,
      tickMargin               = 2;

  //private
  var values                   = d3.range(min, max + 1, step),
      startDragOffsetX         = 0,
      currentHandlePosition    = 0,
      startDragHandlePosition  = 0,
      nodeOffset               = {};

  //html elements
  var node = container.append("div")
      .attr("class", "g-slider")
      .style("position", "absolute")
      .style("left", trackMargin * 2 + "px")
      .style("top", (box.height - trackHeight) / 2 + "px");

  var track = node.append("div")
      .attr("class", "g-track")
      .style("position", "absolute")
      .style("background", "#ddd")
      .style("border-top", "solid 1px #999")
      .style("border-bottom", "solid 1px #ccc")
      .style("border-radius", trackHeight + "px")
      .style("width", trackWidth + "px")
      .style("height", trackHeight + "px");

  var insetContainer = track.append("div")
      .attr("class", "g-insetContainer")
      .style("width", trackWidth + "px")
      .style("position", "absolute");

  var tickContainer = insetContainer.append("div")
      .attr("class", "g-tickContainer")
      .style("width", trackWidth + "px")
      .style("position", "absolute")
      .style("top", trackHeight + tickMargin + "px");

  var handle = insetContainer.append("div")
      .attr("class", "g-handle")
      .style("position", "absolute");

  var knob = handle.append("div")
      .attr("class", "g-knob")
      .style("position", "absolute")
      .style("height", handleWidth + "px")
      .style("width", handleWidth + "px")
      .style("left", - handleWidth / 2 + "px")
      .style("top", - (handleWidth + 2) / 2 + trackHeight / 2 + "px")
      .style("border-radius", handleWidth + "px")
      .style("border", "solid 1px #aaa")
      .style("box-shadow", "0 1px 3px rgba(0, 0, 0, 0.2)")
      .style("background", "white");


  var indexFromValue = {};
  values.forEach(function(val, i){
    indexFromValue[val + ""] = i;
  });

  var currentIndex = indexFromValue[value];

  node.on('mousedown',function(){
    d3.event.preventDefault();
    updateMeasurements();
    startDrag();
    d3.select(document).on("mouseup", function(){
      d3.select(document).on("mouseup", null);
      stopDrag();
    });
  });

  setIndex(value);


  this.parentNode.insertBefore(container.node(), this);
  this.parentNode.removeChild(this);

  /* Public Methods */

  function setIndex(index) {
    if (index === currentIndex ) {
      return;
    }
    if (index < 0) {
      index = 0;
    }
    if ( index > (values.length - 1) ) {
      index = values.length - 1;
    }

    currentIndex = index;
    currentValue = values[currentIndex];
    positionHandle();
    container.node().value = currentValue;
    event.change.call(container.node());
  }

  function setValue(value) {
    setIndex(indexFromValue[value]);
  }

  /* Handle positioning */

  function positionHandle() {
      var ratio = currentIndex / ( values.length - 1 );
      handle.style("left", ratio * 100 + "%");
      currentHandlePosition = ratio;
  }

  function updateMeasurements() {
    // trackWidth = node.width() - 2 * handleSideOffset;
    nodeOffset = node.node().getBoundingClientRect();
  }

  /* Dragging */

  function startDrag() {
    startDragOffsetX = d3.event.pageX;
    startDragHandlePosition = currentHandlePosition * trackWidth;
    onDrag();
    d3.select(document).on('mousemove', function(){
      onDrag();
    });
  }

  function onDrag() {
    var x = d3.event.pageX - nodeOffset.left;
    setRatio(x / trackWidth);
  }

  function stopDrag(evt) {
    // acm - added for grabbing cursor
    d3.select(document).on("mousemove", null);
    // $j(document).unbind('mousemove');
  }

  function setRatio(ratio) {
    setIndex( Math.round( ( values.length - 1 ) * ratio ) );
  }
});
