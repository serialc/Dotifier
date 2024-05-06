// By: Cyrille Medard de Chardon
// Filename: dotify.js
// Feb 11, 2010.

//Declare global variables
var DOTIFY = {};

DOTIFY.constants = {
	svgOffsetX: 0,
	svgOffsetY: 0,
	maxCanvasDim: 675,
	minSize: 2,
	maxSize: 6,
	canvasW: 0,
	canvasH: 0,
	penMode: false,
	circleSizes: 3,	//this is actually the radius span (if 2, and minSize is 2 circles will have a radius of 2-4)
	buffer: 0,
	edgeBuffer: 1,
	brushWidth: 1,
	brushLeadIO: 1,
	brushLeadStatus: 0,
	brushLeadValue: 1,
	brushDensity: 5,	//lower if it lags
	drawMode: true,
	allowOverlap: false,
	svgNS: "http://www.w3.org/2000/svg"
};

DOTIFY.data = {
	count: 0,
	circles: {},
	colours: {},
	shp_count: 0,
	shapes: {}
};
//End of global variables

//Main Code

hide = function(id) {
	document.getElementById(id).setAttributeNS(null, 'visibility','hidden');
};

show = function(id) {
	document.getElementById(id).setAttributeNS(null, 'visibility','visible');
};

vanish = function(id) {
	document.getElementById(id).style.display = 'none';
};

appear = function(id) {
	document.getElementById(id).style.display = 'inherit';
};

//determines visibility of draw_mode or edit_zone_mode
showDrawMode = function(state) {
	if(state) {
		vanish('edit_zone_mode');
		appear('draw_mode');
		DOTIFY.constants.drawMode = true;
	} else {
		vanish('draw_mode');
		appear('edit_zone_mode');
		DOTIFY.constants.drawMode = false;
	}
};

print = function(text) {
	document.getElementById('outputParag').appendChild(document.createTextNode(text+'\n'));
};

toggleTargetVis = function(evt) {
	if(this.checked) {
		hide('targetZone');
	} else {
		show('targetZone');
	}
};

//changes constant regarding allowing overlap
toggleOverlap = function(evt) {
	if(this.checked) {
		DOTIFY.constants.allowOverlap = true;
	} else {
		DOTIFY.constants.allowOverlap = false;
	}
};

//for testing, prints out shape data
printShapeData = function() {
	var text = '';
	var shp;

	for(data in DOTIFY.data.shapes) {
		shp = DOTIFY.data.shapes[data];
		text += data + ' is type:' + shp.type + ' z:' + shp.z + ' x:' + shp.x + ' y:' + shp.y + ' w:' + shp.w + ' h:' + shp.h + ' r:' + shp.r + '\n';
	}
	print(text);
};

//for testing, prints out all data
printCirclesData = function() {
	var text = '';
	var i = 0;
	for(data in DOTIFY.data.circles) {
		text += i++ + ' is ' + DOTIFY.data.circles[data].cx + ':' + DOTIFY.data.circles[data].cy + ':' + DOTIFY.data.circles[data].cr + '; ';
	}
	print(text);
};

//pythagoras distance calculation between to points
calcDistance = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//test DOT location/size for canvas edge collision
hitEdge = function(x, y, r) {

	//if the edge of the circle is above or to the left of the canvas return true 
	if( x-r < 0 + DOTIFY.constants.edgeBuffer || y-r < 0 + DOTIFY.constants.edgeBuffer ) {
		return true;
	}
	
	//if the edge of the circle is below or to the right of the canvas return true
	if( (x+r) > (DOTIFY.constants.canvasW - DOTIFY.constants.edgeBuffer) || (y+r) > (DOTIFY.constants.canvasH - DOTIFY.constants.edgeBuffer) ) {
		return true;
	}
	return false;
};

//check for collision between proposed point and every other point as well to canvas edge
checkForCollision = function(x, y, r) {

	//see if dot is too close to canvas edge
	if( hitEdge(x, y, r) ) {
		return true;
	}

	var shp;
	//see if dot is too close to another existing point
	for(data in DOTIFY.data.circles) {
		shp = DOTIFY.data.circles[data];
		//if the new circle overlaps an older circle or the edge of the canvas return true
		if(calcDistance(x, y, shp.cx, shp.cy) < (DOTIFY.constants.buffer + shp.cr + r)) {
			return true;
		}
		//else continue checking the rest
	}
	return false;
};

//tests parameters and if okay creates a new SVG circle object and adds it to JS data
createCircle = function(c_colour, c_size, c_locx, c_locy, zone) {

	//if dot overlaps are not allowed check for collision
	if(DOTIFY.constants.allowOverlap === false) {

		//see if new proposed circle is too close to another existing circle - if yes skip creation of new circle
		while(checkForCollision(c_locx, c_locy, c_size)) {
			c_size = c_size - 0.5;
			if(c_size < DOTIFY.constants.minSize) {
				return;
			}
		}
	}
	
	//create circle element
	var newCircle = document.createElementNS(DOTIFY.constants.svgNS, "circle");

	//set circle attributes
	newCircle.setAttributeNS(null, 'cx', c_locx);
	newCircle.setAttributeNS(null, 'cy', c_locy);
	newCircle.setAttributeNS(null, 'r', c_size);
	newCircle.setAttributeNS(null, 'fill', c_colour);

	//Add circle to svg canvas
	document.getElementById('dots' + zone).appendChild(newCircle);

	//Add circle 0bject to data set
	DOTIFY.data.circles[DOTIFY.data.count] = {cx: c_locx, cy: c_locy, cr: c_size, z: zone, f: c_colour};
	DOTIFY.data.count = DOTIFY.data.count + 1;
};

//get a random float size determined by DOTIFY.constants.minSize and .circleSizes
getRandCircleSize = function() {
	return ((Math.random() * DOTIFY.constants.circleSizes) + DOTIFY.constants.minSize);
};

//get a random integer
getRandInt = function(range) {
	return (Math.ceil(Math.random()*range));
};

//onclick of SVG canvas do this
handle_SVG_Canvas_Click = function(evt, xshift, yshift) {
	var targeted_zone = evt.target.parentNode.id;
	var resolved_x = evt.clientX - DOTIFY.constants.svgOffsetX + window.pageXOffset + xshift;
	var resolved_y = evt.clientY - DOTIFY.constants.svgOffsetY + window.pageYOffset + yshift;

	var clr_style = getRandInt(3);

	switch (targeted_zone) {
		case 'z1':
			clr_style = DOTIFY.data.colours['z1c' + clr_style];
		break;

		case 'z2':
			clr_style = DOTIFY.data.colours['z2c' + clr_style];
		break;

		case 'z3':
			clr_style = DOTIFY.data.colours['z3c' + clr_style];
		break;

		case 'bg_rect_g':
			//you clicked/mouse over bg_rect - no problem - do nothing
		return;//notice this is not a break;
		//break; //not required
		
		default:
			alert('ERROR: handle_SVG_Canvas_Click failed to determine which zone you clicked on! Clicked on ' + targeted_zone);
	}

	createCircle(clr_style, getRandCircleSize(), resolved_x, resolved_y, targeted_zone);
};

// based on http://www.quirksmode.org/js/findpos.html
//find the x,y location of the object
findObj = function(obj) {
	var curleft = 0;
	var curtop = 0;

	if (obj.offsetParent) {
		while (obj.offsetParent) {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
			obj = obj.offsetParent;
		}
		return [curleft,curtop];
	}
};

//converts object containing three 0-255 values and returns a six digit hex value
prepColours = function(colour) {
	colour.R = parseInt(colour.R,10).toString(16);
	colour.G = parseInt(colour.G,10).toString(16);
	colour.B = parseInt(colour.B,10).toString(16);
	
	for( clr in colour ) {
		//if it is '0' --> '00'
		if(colour[clr] === '0' ) {
			colour[clr] = '00';
		} else if(colour[clr].length === 1) {
			//the value is not '0' but only has 1 digit, append a zero
			colour[clr] = '0' + colour[clr];
		}
	}

	//create 6 value hex colour code
	return colour.R + '' + colour.G + '' + colour.B;
};

getLocationRGB = function(x, y) {
	var hex_colour = '';
	var sec_size = 200/6;
	var sec_colour = parseInt(y/sec_size,10);

	//hold a 0 to 255 value
	var w_val = 0;
	var b_val = 0;
	var c_val = {};

	var colour = {
		R: 0,
		G: 0,
		B: 0
	};
	
	//clicked on main palette
	if(x < 201) {
		//determine black / white of colour
		if(x > 100) {
			// 100 < x < 201
			b_val = parseInt((x-100)*255/100,10);
		} else {
			// x < 101
			w_val = parseInt((100-x)*255/100,10);
		}
		
		//based on section get y, convert to 0-255 range value
		hue = (y-(sec_size*sec_colour))*255/sec_size;

		c_val.c_none = 0+w_val;
		c_val.c_vary_inc = (hue)+(w_val*(1 - hue/255))-(b_val*(hue/255));
		c_val.c_vary_dec = (255-hue)+(w_val*(hue/255))-(b_val*(1 - hue/255));
		c_val.c_full = 255-b_val;

		switch(sec_colour) {
			case 0:
				//red to yellow, section 1
				// full red, increasing green, no blue
				//determine R G B colour values and create hex 6 value string
				colour.R = c_val.c_full;
				colour.G = c_val.c_vary_inc;
				colour.B = c_val.c_none;
			break;
			case 1:
				//yellow to green, section 2
				//decreasing red, full green, no blue
				colour.R = c_val.c_vary_dec;
				colour.G = c_val.c_full;
				colour.B = c_val.c_none;
			break;
			case 2:
				//green to teal, section 3
				//no red, full green, increasing blue
				colour.R = c_val.c_none;
				colour.G = c_val.c_full;
				colour.B = c_val.c_vary_inc;
			break;
			case 3:
				//teal to blue, section 4
				//no red, decreasing green, full blue
				colour.R = c_val.c_none;
				colour.G = c_val.c_vary_dec;
				colour.B = c_val.c_full;
			break;
			case 4:
				//blue to fucia, section 5
				//increasing red, no green, full blue
				colour.R = c_val.c_vary_inc;
				colour.G = c_val.c_none;
				colour.B = c_val.c_full;
			break;
			case 5:
				//fucia to red, section 6
				//full red, no green, decreasing blue
				colour.R = c_val.c_full;
				colour.G = c_val.c_none;
				colour.B = c_val.c_vary_dec;
			break;
		}

		//assemble colour 0-255 values to hex colour code
		hex_colour = prepColours(colour);

	} else {	//clicked on greyscale palette
		//x is 201 to 220
		hex_colour = parseInt(y*255/200,10).toString(16);
		if(hex_colour.length === 1) {
			hex_colour = '0' + hex_colour;
		}
		//format nicely
		hex_colour = hex_colour + '' + hex_colour + '' + hex_colour;
	}
	return hex_colour;
};

openPalette = function(source) {

	//source contains name of input colour element id
	var inputfield = document.getElementById(source);

	//Make the palette visible
	var ovrlay = document.getElementById('overlay_bg');
	var ovrlay_pal = document.getElementById('overlay_palette');
	
	//if the palette is already visible - hide it
	if(ovrlay.style.visibility === 'visible') {
		ovrlay.style.visibility = 'hidden';
		return;
	}

	//if it's not hidden display it now
	ovrlay.style.visibility = 'visible';
	
	//get the location of the SVG palette to determine relative mouse click location
	var svgpalPkg = document.getElementById('svgpalPkg');
	var pal_offset = findObj(svgpalPkg);

	//get svg palette for event handling
	var svgpal = document.getElementById('svgpal');

	//on click get location of click on palette, convert to hex colour, update input field, close palette
	if(svgpal.addEventListener) {
		svgpal.addEventListener("click", paletteClick = function(evt) {
			//could just set visibility to '' since css is set to hidden - but this is explicit/repititious to avoid confusion.
			ovrlay.style.visibility = 'hidden';
			svgpal.removeEventListener("click", paletteClick, false);
			svgpal.removeEventListener("mousemove", paletteMove, false);
		}, false);

		svgpal.addEventListener("mousemove", paletteMove = function(evt) {
			//determine relative mouse location
			var slvd_x = evt.clientX - pal_offset[0] + window.pageXOffset;
			var slvd_y = evt.clientY - pal_offset[1] + window.pageYOffset;

			//determine colour based on click location
			var hex_colour = getLocationRGB(slvd_x, slvd_y);
			inputfield.value = hex_colour;

			//change border colour of input to the value
			inputfield.style.border = 'solid 3px #' + hex_colour;

			ovrlay_pal.style.backgroundColor = '#' + hex_colour;

			//if the palette is being used for the svg bg colour
			if(inputfield.id === 'bgcolour') {
				document.getElementById('bg_rect').setAttributeNS(null, 'fill', '#' + hex_colour);
				return;
			}

			//add colour to global namespace data
			DOTIFY.data.colours[source] = '#' + hex_colour;

		}, false);
	}
};

//only called from direct change of input field value - not palette
updateHexInput = function(evt) {
	var subval = this.value;

	//if empty replace with string '0'
	if(subval === '') {
		subval = '0';
	}

	//removes all characters from input except hex 0-9a-f
	var clean = subval.replace(/[^0-9a-f]/gi,'');

	if(clean.length === 0) {
		clean = '0';
	}

	//fix greyscale input
	if(clean.length === 1 || clean.length === 2) {
		clean = clean + '' + clean + '' + clean;
	}

	//warn of invalid colour value and return
	if(clean.length === 4 || clean.length === 5) {
		clean = 'invalid';
		this.value = clean;
		return;
	}

	//only valid hex values proceed past this point

	//reset input to cleaned hex number
	this.value = clean;

	//change border colour of input to the value
	this.style.border = 'solid 3px #' + clean;
	
	//if this is the bgcolour simply change the colour, don't store in data
	if(this.id === 'bgcolour') {
		document.getElementById('bg_rect').setAttributeNS(null,'fill','#' + clean);
		return;
	}

	//add to global namespace data
	DOTIFY.data.colours[this.id] = '#' + clean;
};

//used to update globabl variables when users change input fields
updateInput = function(evt) {
	var subval = this.value;

	//if empty replace with string '0'
	if(subval === '') {
		subval = '0';
	}
	
	//removes all characters from input except digits 0-9
	var clean = parseInt('0' + subval.replace(/[^0-9]/gi,''),10);

	switch(this.id) {
		case 'canvasw':
			if(clean > DOTIFY.constants.maxCanvasDim) {
				clean = DOTIFY.constants.maxCanvasDim;
			}
			DOTIFY.constants.canvasW = clean;
			document.getElementById('svgobj').setAttributeNS(null, 'width', clean);
			document.getElementById('bg_rect').setAttributeNS(null, 'width', clean);
		break;
		
		case 'canvash':
			if(clean > DOTIFY.constants.maxCanvasDim) {
				clean = DOTIFY.constants.maxCanvasDim;
			}
			DOTIFY.constants.canvasH = clean;
			document.getElementById('svgobj').setAttributeNS(null, 'height', clean);
			document.getElementById('bg_rect').setAttributeNS(null, 'height', clean);
		break;

		case 'dotmin':
			DOTIFY.constants.minSize = clean;
			if(clean > DOTIFY.constants.maxSize) {
				document.getElementById('dotmax').value = clean;
				DOTIFY.constants.maxSize = clean;
				DOTIFY.constants.circleSizes = 0;
			}
		break;

		case 'dotmax':
			//convert size max input into a range value (max - min)
			if(clean < DOTIFY.constants.minSize) {
				clean = DOTIFY.constants.minSize;
			}
			
			DOTIFY.constants.circleSizes = clean - DOTIFY.constants.minSize;
		break;

		case 'dotbuf':
			DOTIFY.constants.buffer = clean;
		break;

		case 'brush_width':
			if(clean < 1) {
				clean = 1;
			}
			DOTIFY.constants.brushWidth = clean;
		break;

		case 'brush_leadio':
			if(clean < 1) {
				clean = 1;
			}
			DOTIFY.constants.brushLeadIO = clean;
		break;

		default:
			alert('ERROR: updateInput failed!');
		break;
	}

	//update input field with cleaned/changed value
	this.value = clean;
};

//delete all the OPTION tags in the SELECT
deleteZoneOptionTags = function(zone_del) {
	var select_zone = document.getElementById(zone_del+'del');
	while(select_zone.children.length > 2) {
		//stop when only the delall option is left
		select_zone.removeChild(select_zone.children[2]);
	}
};

//delete all the shapes in a zone: remove items from menu, DB, and SVG from canvas
//passed value zone_del must be: z1, z2, or z3
deleteZoneShapes = function(zone_del) {
	//delete SVG data
	var svg_zone = document.getElementById(zone_del);
	while(svg_zone.childNodes.length > 0) {
		//stop when no children
		svg_zone.removeChild(svg_zone.firstChild);
	}
	
	//delete OPTION data from form element
	deleteZoneOptionTags(zone_del);

	//delete data from global data set
	var sdel;
	for( shp in DOTIFY.data.shapes ) {
		sdel = DOTIFY.data.shapes[shp];
		if(sdel.z === zone_del) {
			delete DOTIFY.data.shapes[shp];
		}
	}
};

//flashes the SVG shape that the mouse moved over
flashShape = function(evt) {
	//gets the option element from Firefox
	var selection = evt.target;

	//if safari it gets the SELECT so get the element differently
	if(selection.nodeName === 'SELECT') {
		selection = evt.target[evt.target.selectedIndex];
	}

	if(selection.nodeName === 'OPTION') {
		if(selection.id !== 'delall' && selection.id !== '') {
			document.getElementById('shp_' + selection.id).style.fill = '#8a8';
			flashit = function() {
				document.getElementById('shp_' + selection.id).style.fill = '';
			};
			setTimeout(flashit, 200);
		}
	}
};

//deletes a zone shape from SVG canvas, Dataset, and SELECT form
deleteShape = function(evt) {
	var selection = this.options[this.selectedIndex];

	//if this is the empty field do nothing and return
	if(selection.id === '') {
		return; //nothing selected
	}

	if(selection.id === 'delall') {
		//delete all objects in zone
		deleteZoneShapes(this.id.slice(0,2));
	} else {
		//remove OPTION element from SELECT list
		this.remove(this.selectedIndex);

		//remove SVG element
		var svg_elem = document.getElementById('shp_' + selection.id);
		var parent_zone = svg_elem.parentNode;
		parent_zone.removeChild(svg_elem);

		//remove element from global dataset
		var shape_db_num = selection.id.slice(3);
		delete DOTIFY.data.shapes[parseInt(shape_db_num,10)];
	}

	//select the blank field again
	this.options[0].selected = true;
};

//deletes DOTs from the SVG canvas
deleteDots = function(evt) {
	var selection = this.options[this.selectedIndex];

	//if this is the empty field do nothing and return
	if(selection.value === '') {
		return; //nothing selected
	}

	var zone_to_empty;
	var zone = selection.value;

	if(selection.value === '-1') {
		var i;
		//delete the SVG DOTS for all three zones
		for(i = 1; i < 4; i++) {
			zone_to_empty = document.getElementById('dotsz' + i);
			while(zone_to_empty.childNodes.length > 0) {
				zone_to_empty.removeChild(zone_to_empty.firstChild);
			}
		}

		//delete the DOTS from the dataset
		for(dot in DOTIFY.data.circles) {
			delete DOTIFY.data.circles[dot];
		}
	} else {
		//delete all the children in the zone
		//deletes SVG elements
		zone_to_empty = document.getElementById('dots' + zone);
		while(zone_to_empty.childNodes.length > 0) {
			zone_to_empty.removeChild(zone_to_empty.firstChild);
		}

		//deletes DOTs from dataset
		for(dot in DOTIFY.data.circles) {
			if(DOTIFY.data.circles[dot].z === zone) {
				delete DOTIFY.data.circles[dot];
			}
		}
	}

	//select blank first value
	this.options[0].selected = true;
};

dotBlast = function(evt, dots) {
	var i, dist, xshift, yshift;
	for( i = 0; i < dots; i++ ) {
		dist = getRandInt(DOTIFY.constants.brushWidth*DOTIFY.constants.brushLeadValue / DOTIFY.constants.brushLeadIO);
		xshift = dist*Math.sin(Math.PI*2*i/dots);
		yshift = dist*Math.cos(Math.PI*2*i/dots);
		handle_SVG_Canvas_Click(evt, xshift, yshift);
	}
};

brushPaint = function(evt) {
	//if brush width is 1 simply draw a point and return/exit function
	if(DOTIFY.constants.brushWidth === 1) {
		switch (evt.type) {
			case 'click':
			case 'mousemove':
				handle_SVG_Canvas_Click(evt, 0, 0);
			break;

			case 'mouseup':
				DOTIFY.constants.penMode = false;
			break;
		}
		return;
	}

	var dots;

	switch (evt.type) {
		case 'click':
			dots = DOTIFY.constants.brushWidth * DOTIFY.constants.brushDensity;
			dotBlast(evt, dots);
		break;

		case 'mousemove':
			//draw the brush width based on length of stroke (lead in and out)
			switch (DOTIFY.constants.brushLeadStatus) {
				case 0:
					DOTIFY.constants.brushLeadStatus = 1;
					DOTIFY.constants.brushLeadValue = 0;
				break;

				case 1:
					//calculate the number of dots based on proportion of leadin complete
					dots = (DOTIFY.constants.brushWidth*DOTIFY.constants.brushLeadValue / DOTIFY.constants.brushLeadIO) * DOTIFY.constants.brushDensity;

					//draw all the dots
					dotBlast(evt, dots);

					//grow the brush size incrementally - when maxed go to next stage
					if(DOTIFY.constants.brushLeadIO > DOTIFY.constants.brushLeadValue) {
						DOTIFY.constants.brushLeadValue++;
					} else {
						DOTIFY.constants.brushLeadStatus = 2;
					}
				break;

				case 2:
					dots =  DOTIFY.constants.brushWidth * DOTIFY.constants.brushDensity;
					dotBlast(evt, dots);
				break;

				case 3:
					//calculate the number of dots based on proportion of lead out complete
					dots = (DOTIFY.constants.brushWidth*DOTIFY.constants.brushLeadValue / DOTIFY.constants.brushLeadIO) * DOTIFY.constants.brushDensity;
					
					//draw all the dots
					dotBlast(evt, dots);

					//shrink the brush size incrementally = when 0 go to stage 0
					if(DOTIFY.constants.brushLeadValue > 1) {
						DOTIFY.constants.brushLeadValue--;
					} else {
						DOTIFY.constants.brushLeadStatus = 0;
						DOTIFY.constants.penMode = false;
					}
				break;
					
				default:
					alert('An error occured when brushing in function brushPaint.');
			}
		break;

		case 'mouseup':
			DOTIFY.constants.brushLeadStatus = 3;
		break;

		default:
			alert('error in brushPaint');
	}
};

//Determines whether we are in drawMode or not (edit zone mode), allows correct interaction
setPenMode = function(evt) {

	
	
	//if in drawMode then create circles on click
	//if in drawMode and shift key pressed draw circles as mouse moves
	//if in edit zone mode (drawMode === false) then allow the creation of new shapes.

	if(DOTIFY.constants.drawMode === true) {
		var key;

		switch (evt.type) {
			case 'click':
				if(DOTIFY.constants.penMode === false) {
					brushPaint(evt);
				}
			break;

			case 'mousemove':
				if(DOTIFY.constants.penMode === true) {
					brushPaint(evt);
				}
			break;

			case 'mousedown':
				DOTIFY.constants.penMode = true;
			break;

			case 'mouseup':
				if(DOTIFY.constants.penMode === true) {
					brushPaint(evt);
				}
			break;

			case 'keydown':
				key = evt.charCode || evt.keyCode;
				if(key === 16) {//'shift' key
					DOTIFY.constants.penMode = true;
				}
			break;

			case 'keyup':
				key = evt.charCode || evt.keyCode;
				if(key === 16) {
					DOTIFY.constants.penMode = false;
				}
			break;
		}
	}
};

//allows the clicking and dragging on canvase to create new shapes (rect or cirlce)
handleZoneEdit = function(evt) {

	evt.preventDefault();

	//if in edit zone mode (drawMode === false) than allow the creation of new shapes.
	if(DOTIFY.constants.drawMode === false) {

		var new_shape;

		//In zone shapes edit mode - create new shapes
		switch(evt.type) {
			case 'mousedown':
				//check if a shape already in creation exists do not start creating a new one 
				if(document.getElementById('new_shape_temp')) {
					return;
				}

				//catch the X,Y mouse location
				DOTIFY.constants.shapeCreation = {};
				DOTIFY.constants.shapeCreation.xOrig = evt.clientX - DOTIFY.constants.svgOffsetX + window.pageXOffset;
				DOTIFY.constants.shapeCreation.yOrig = evt.clientY - DOTIFY.constants.svgOffsetY + window.pageYOffset;

				var i, zone_t, shp_t;
				//check the six radio buttons and see which one is checked
				for( i = 1; i < 4; i++ ) {
					if(document.getElementById('z' + i + 'c').checked === true) {
						
						shp_t = 'c';
						zone_t = i;
						new_shape = document.createElementNS(DOTIFY.constants.svgNS, "circle");
						new_shape.setAttributeNS(null, 'cx', DOTIFY.constants.shapeCreation.xOrig);
						new_shape.setAttributeNS(null, 'cy', DOTIFY.constants.shapeCreation.yOrig);
						new_shape.setAttributeNS(null, 'r', 10);

					} else if(document.getElementById('z' + i + 'r').checked === true) {
					
						shp_t = 'r';
						zone_t = i;
						new_shape = document.createElementNS(DOTIFY.constants.svgNS, "rect");
						new_shape.setAttributeNS(null, 'x', DOTIFY.constants.shapeCreation.xOrig);
						new_shape.setAttributeNS(null, 'y', DOTIFY.constants.shapeCreation.yOrig);
						new_shape.setAttributeNS(null, 'width', 10);
						new_shape.setAttributeNS(null, 'height', 10);
					}
				}

				new_shape.setAttributeNS(null, 'stroke', 'black');
				new_shape.setAttributeNS(null, 'fill', 'none');
				new_shape.setAttributeNS(null, 'id', 'new_shape_temp');
				
				DOTIFY.constants.shapeCreation.type = shp_t;
				DOTIFY.constants.shapeCreation.zone = zone_t;

				//Add shape to svg canvas
				document.getElementById('svgobj').appendChild(new_shape);
			break;

			case 'mousemove':
				//if actively creating shape

				if(DOTIFY.constants.shapeCreation) {
					//resize shape
					//get new mouse coordinates
					var nx = evt.clientX - DOTIFY.constants.svgOffsetX + window.pageXOffset;
					var ny = evt.clientY - DOTIFY.constants.svgOffsetY + window.pageYOffset;

					new_shape = document.getElementById('new_shape_temp');

					if(DOTIFY.constants.shapeCreation.type === 'c') {
						//Circle Radius Edit
						new_shape.setAttributeNS(null,'r', parseInt(calcDistance(nx, ny, DOTIFY.constants.shapeCreation.xOrig, DOTIFY.constants.shapeCreation.yOrig),10));
					} else {
						//Rectangle Shape Edit
						//depending on mouse location change x,y and width/height or only width/height.
						if(nx < DOTIFY.constants.shapeCreation.xOrig) {
							new_shape.setAttributeNS(null,'width', DOTIFY.constants.shapeCreation.xOrig - nx);
							new_shape.setAttributeNS(null,'x', nx);
						} else {
							new_shape.setAttributeNS(null,'width', nx - DOTIFY.constants.shapeCreation.xOrig);
						}

						if(ny < DOTIFY.constants.shapeCreation.yOrig) {
							new_shape.setAttributeNS(null,'height', DOTIFY.constants.shapeCreation.yOrig - ny);
							new_shape.setAttributeNS(null,'y', ny);
						} else {
							new_shape.setAttributeNS(null,'height', ny - DOTIFY.constants.shapeCreation.yOrig);
						}
					}
				}
			break;
			
			case 'mouseup':
			case 'click': //equivalent to up
			default:
				if(DOTIFY.constants.shapeCreation) {

					//move to correct target zone and format correctly
					new_shape = document.getElementById('new_shape_temp');

					new_shape.setAttributeNS(null, 'stroke', '');
					new_shape.setAttributeNS(null, 'fill', '');
					new_shape.setAttributeNS(null, 'id', '');
					
					//put the shape in its home in the correct zone graphic element
					document.getElementById('z' + DOTIFY.constants.shapeCreation.zone).appendChild(new_shape);

					//adds new shape to DB
					getZoneShapes();

					//deletes all the shapes from the deletion list
					deleteZoneOptionTags('z1');
					deleteZoneOptionTags('z2');
					deleteZoneOptionTags('z3');

					//recreate a list for the deletion form of all the shapes in the DB
					setShapeForm();

					//delete data
					delete DOTIFY.constants.shapeCreation;

				}
			break;
		}
	}
};

setEventListeners = function() {

	//get the target zone in the SVG element
	var target = document.getElementById('targetZone');

	//give zone 'clickability' to add DOTs manually
	if(target.addEventListener) {
		target.addEventListener("click", setPenMode, false);
		target.addEventListener("mousemove", setPenMode, false);
		target.addEventListener("mouseup", setPenMode, false);
		target.addEventListener("mousedown", setPenMode, false);
	}

	//get the whole svg zone
	var SVGobject = document.getElementById('svgobj');
	//give the svgobj object clickability
	if(SVGobject.addEventListener) {
		SVGobject.addEventListener("mousedown", handleZoneEdit, false);
		SVGobject.addEventListener("mousemove", handleZoneEdit, false);
		SVGobject.addEventListener("mouseup", handleZoneEdit, false);

		//note the below points to setPenMode
		SVGobject.addEventListener("mouseup", setPenMode, false);
	}

	//give shift key - pen dotify ability
	if(document.addEventListener) {
		document.addEventListener("keydown", setPenMode, false);
		document.addEventListener("keyup", setPenMode, false);
	}

	//get canvas width from inputs
	var canv_w = document.getElementById('canvasw');
	if(canv_w.addEventListener) {
		canv_w.addEventListener("change", updateInput, false);
	}

	//get canvas height from inputs
	var canv_h = document.getElementById('canvash');
	if(canv_h.addEventListener) {
		canv_h.addEventListener("change", updateInput, false);
	}

	//get DOT sizes from inputs
	var dmin = document.getElementById('dotmin');
	if(dmin.addEventListener) {
		dmin.addEventListener("change", updateInput, false);
	}

	//get DOT max size from inputs
	var dmax = document.getElementById('dotmax');
	if(dmax.addEventListener) {
		dmax.addEventListener("change", updateInput, false);
	}

	//get DOT buffer size from inputs
	var bufval = document.getElementById('dotbuf');
	if(bufval.addEventListener) {
		bufval.addEventListener("change", updateInput, false);
	}

	var brush_width = document.getElementById('brush_width');
	if(brush_width.addEventListener) {
		brush_width.addEventListener("change", updateInput, false);
	}

	var brush_leadio = document.getElementById('brush_leadio');
	if(brush_leadio.addEventListener) {
		brush_leadio.addEventListener("change", updateInput, false);
	}

	//hide/show the zone target shapes from SVG-canvas
	var togtar = document.getElementById('toggle_targets');
	if(togtar.addEventListener) {
		togtar.addEventListener("change", toggleTargetVis, false);
	}

	//dis/allow DOT overlap
	var dot_overlap = document.getElementById('allow_overlap');
	if(dot_overlap) {
		dot_overlap.addEventListener("change", toggleOverlap, false);
	}

	//delete dots in zones
	var deldot_select = document.getElementById('deldots');
	if(deldot_select.addEventListener) {
		deldot_select.addEventListener("change", deleteDots, false);
	}

	//update background colour of SVG canvas
	var bgcolour = document.getElementById('bgcolour');
	if(bgcolour.addEventListener) {
		bgcolour.addEventListener("change", updateHexInput, false);
	}

	var i, j;
	i = j = 1;
	var clr_in;
	for( i = 1; i < 4; i++ ) {
		for( j = 1; j < 4; j++ ) {
			if(!(clr_in = document.getElementById('z' + i + 'c' + j))) {
				alert('ERROR: Cannot find the id z' + i + 'c' + j + '!');
			}
			if(clr_in.addEventListener) {
				clr_in.addEventListener("change", updateHexInput, false);
			}
		}
	}

	//set Zone Shape select dropdown listeners to delete shapes
	//var i; //already defined
	for( i = 1; i < 4; i++ ) {
		var shp_del = document.getElementById('z' + i + 'del');
		if(shp_del.addEventListener) {
			shp_del.addEventListener("mouseover", flashShape, false);
			shp_del.addEventListener("change", deleteShape, false);
		}
	}
};

//scan the SVG canvas and store the results
getCanvasProperties = function() {
	//div holder element of SVG (cannot get location property of SVG element)
	var svg_container = document.getElementById('svgPkg');

	//find the x,y coordinates of the svg canvas
	var loc = findObj(svg_container);

	//assign locations to global variable
	DOTIFY.constants.svgOffsetX = parseInt(loc[0], 10);
	DOTIFY.constants.svgOffsetY = parseInt(loc[1], 10);

	//actual SVG element properties
	var svg_elem = document.getElementById('svgobj');

	//get the SVG canvas size
	DOTIFY.constants.canvasW = parseInt(svg_elem.getAttributeNS(null, 'width'), 10);
	DOTIFY.constants.canvasH = parseInt(svg_elem.getAttributeNS(null, 'height'), 10);

	//get the default zone colours from inputs
	var i, j, clr_id;
	i = j = 1;

	for( i = 1; i < 4; i++ ) {
		for( j = 1; j < 4; j++ ) {
			//construct id format
			clr_id = 'z' + i + 'c' + j;

			//get colour element
			clr_elem = document.getElementById(clr_id);

			//put value in data set
			DOTIFY.data.colours[clr_id] = '#' + clr_elem.value;

			//update border of input according to value
			clr_elem.style.border = 'solid 3px #' + clr_elem.value;
		}
	}
};

//read in the default values of the form and put them in the global data set
getFormDefaults = function() {
	//get min circle size value
	var min = parseInt(document.getElementById('dotmin').value, 10);
	DOTIFY.constants.minSize = min;
	
	//get circle range value
	DOTIFY.constants.circleSizes = parseInt(document.getElementById('dotmax').value - min, 10);

	//get buffer value
	DOTIFY.constants.buffer = parseInt(document.getElementById('dotbuf').value, 10);

	//get the brush width and lead in/out
	DOTIFY.constants.brushWidth = parseInt(document.getElementById('brush_width').value, 10);
	DOTIFY.constants.brushLeadIO = parseInt(document.getElementById('brush_leadio').value, 10);
};

//reads shape data and adds elements to shape removal form
setShapeForm = function() {
	var shape;
	var form_del;
	var new_option;

	for(shp in DOTIFY.data.shapes) {
		shape = DOTIFY.data.shapes[shp];
		form_del = document.getElementById(shape.z + 'del');
		new_option = document.createElement('option');
		new_option.value = shp;
		new_option.id = shape.z + '' + shape.type + '' + shp;
		if(shape.type === "c") {
			new_option.innerHTML = 'Circle' + shp;
		} else {
			new_option.innerHTML = 'Rectangle' + shp;
		}
		form_del.appendChild(new_option);
	}
};

//creates a background rect for zone 1
makeBGRect = function() {
	//create SVG shape and add to zone1
	new_shape = document.createElementNS(DOTIFY.constants.svgNS, "rect");
	new_shape.setAttributeNS(null, 'x', 0);
	new_shape.setAttributeNS(null, 'y', 0);
	new_shape.setAttributeNS(null, 'width', DOTIFY.constants.canvasW);
	new_shape.setAttributeNS(null, 'height', DOTIFY.constants.canvasH);
	new_shape.setAttributeNS(null, 'dot', 'x');
	new_shape.setAttributeNS(null, 'id', 'shp_z1r' + DOTIFY.data.shp_count);
				
	//Add rect to svg canvas
	document.getElementById('z1').appendChild(new_shape);

	//add data to DOTIFY.data.shapes
	DOTIFY.data.shapes[DOTIFY.data.shp_count] = {
		z: 'z1',
		type: 'r',
		x: 0,
		y: 0,
		w: DOTIFY.constants.canvasW,
		h: DOTIFY.constants.canvasH
	};

	DOTIFY.data.shp_count++;

	//deletes all the shapes from the deletion list
	deleteZoneOptionTags('z1');
	deleteZoneOptionTags('z2');
	deleteZoneOptionTags('z3');

	//add to deletion form
	setShapeForm();
};

//parse SVG and add shapes to DOTIFY.data.shapes data set
getZoneShapes = function() {
	//get the 'g' element holding the shapes for each zone
	var svg_z = {
		z1: document.getElementById('z1'),
		z2: document.getElementById('z2'),
		z3: document.getElementById('z3')
	};
	
	var zone, children, i, shape;

	//for each zone...
	for(zone in svg_z) {

		//svg_z[zone] is zone element
		children = svg_z[zone].childNodes.length;

		//for each child of the zone...
		for(i = 0; i < children; i++) {

			//shape holds the actually SVG shape
			shape = svg_z[zone].childNodes[i];
			
			//copy info from SVG shape into DOTIFY data set
			if(shape.getAttributeNS(null,'dot') === 'x') {
				// DO NOTHING - shape already recorded
			} else if(shape.nodeName === 'rect') {
				//RECTANGLE
				DOTIFY.data.shapes[DOTIFY.data.shp_count] = {
					z: svg_z[zone].id,
					type: 'r',
					x: parseInt(shape.getAttributeNS(null,'x'),10),
					y: parseInt(shape.getAttributeNS(null,'y'),10),
					w: parseInt(shape.getAttributeNS(null,'width'),10),
					h: parseInt(shape.getAttributeNS(null,'height'),10)
				};

				shape.setAttributeNS(null,'dot','x');
				DOTIFY.data.shp_count = DOTIFY.data.shp_count + 1;
			} else if (shape.nodeName === 'circle') {
				//CIRCLE
				DOTIFY.data.shapes[DOTIFY.data.shp_count] = {
					z: svg_z[zone].id,
					type: 'c',
					x: parseInt(shape.getAttributeNS(null,'cx'),10),
					y: parseInt(shape.getAttributeNS(null,'cy'),10),
					r: parseInt(shape.getAttributeNS(null,'r'),10)
				};

				shape.setAttributeNS(null,'dot','x');
				DOTIFY.data.shp_count = DOTIFY.data.shp_count + 1;
			} else {
				alert('ERROR: a shape object of unexpected form was encountered in your SVG graphic!');
			}

			//if the SVG shape doesn't have an id already - give it one!
			if(!shape.id) {
				shape.id = 'shp_' + zone + '' + DOTIFY.data.shapes[DOTIFY.data.shp_count-1].type + '' + (DOTIFY.data.shp_count - 1);
			}
		}
	}
};

//test for collision between coordinates and all shapes in data set
zoneCollision = function(x, y) {

	var dshp;
	zone_hits = { z1: 0, z2: 0, z3: 0 };

	//go through each shape in DOTIFY.data.shapes
	for(shape in DOTIFY.data.shapes) {

		//shape object dshp
		dshp = DOTIFY.data.shapes[shape];

		if(dshp.type === 'r') {
			if(x > dshp.x && x < (dshp.x + dshp.w) && y > dshp.y && y < (dshp.y + dshp.h)) {
				//coordinates are inside this rectangle
				zone_hits[dshp.z] = zone_hits[dshp.z] + 1;
			}
		} else if (dshp.type === 'c') {
			if(calcDistance(x, y, dshp.x, dshp.y) < dshp.r) {
				//coordinates are inside this circle
				zone_hits[dshp.z] = zone_hits[dshp.z] + 1;
			}
		} else {
			alert('ERROR: Unknown shape type in shape data set!');
		}
	}

	//although we count the number of hits in each zone we do not use it - only 1 is necessary
	if(zone_hits.z3 > 0) {
		return 'z3';
	} else if (zone_hits.z2 > 0) {
		return 'z2';
	} else if (zone_hits.z1 > 0) {
		return 'z1';
	} else {
		return 'none';
	}
};

//the button that dotifies the canvas automatically
dotify = function() {

	var dotnum_elem = document.getElementById('dotnum');

	var subval = dotnum_elem.value;

	//if empty replace with string '1'
	if(subval === '') {
		subval = '1';
	}

	//removes all characters from input except digits 0-9
	var cycles = parseInt('0' + subval.replace(/[^0-9]/gi,''),10);
	dotnum_elem.value = cycles;

	var compltn_elem = document.getElementById('dotifycomp');

	var i = 0;

	//this will be called by setTimeout
	var dotit = function () {
		//get random location
		var x = getRandInt(DOTIFY.constants.canvasW);
		var y = getRandInt(DOTIFY.constants.canvasH);

		//check which zone the coordinates fall starting at the highest, zone3, to zone1, the lowest.
		zone_hit = zoneCollision(x, y);

		//if zone_hit is 'none' do not draw circle
		if(zone_hit === 'none') {
			//do not draw circle
		} else {
			//hook into same function as mouse click
			createCircle(DOTIFY.data.colours[zone_hit + 'c' + getRandInt(3)], getRandCircleSize(), x, y, zone_hit);
			compltn_elem.innerHTML = parseInt((i/cycles)*100,10) + '%';
		}

		//if we still have more circles to draw
		if(i < cycles) {
			i = i + 1;
			setTimeout(dotit,0);
		} else {
			compltn_elem.innerHTML = 'Complete';
		}
	};

	setTimeout(dotit,0);
};

//creates the SVG text output for export
dotExport = function() {
	
	var tarea = document.getElementById('export_ta');
	tarea.style.visibility = 'visible';
	tarea.style.display = 'block';
	var newtext, shp;

	newtext = "<svg xmlns='http://www.w3.org/2000/svg' width='" + DOTIFY.constants.canvasW + "' height='" + DOTIFY.constants.canvasH + "' >\n";
	
	//print out the background
	if(document.getElementById('exp_bg').checked === true) {
		newtext += "<rect x='0' y='0' width='" + DOTIFY.constants.canvasW + "' height='" + DOTIFY.constants.canvasH + "' fill='" + document.getElementById('bg_rect').getAttributeNS(null,'fill') + "' />\n";
	}

	//if the checkbox is checked add zone shapes as well
	if(document.getElementById('exp_zones').checked === true) {
		//some CSS styling
		tarea.innerHTML += "<style type='text/css'>\n/*start CSS*/\n#z1, #z2, #z3 {stroke: none;}\n#z1 {fill: #d99;}\n#z2 {fill: #ff5;}\n#z3 {fill: #339;}\n/* end CSS */\n</style>\n";
		newtext += "<g id='zones'>\n";

		//SVG for shapes
		var i;
		//for each zone
		for( i = 1; i < 4; i++ ) {
			newtext += "<g id='z" + i + "'>\n";
			//for each object in the zone
			for(count in DOTIFY.data.shapes) {
				shp = DOTIFY.data.shapes[count];
				//rect or circle?
				if(shp.z === 'z' + i) {
					if(shp.type === 'r') {
						//rect
						newtext += "<rect x='" + shp.x + "' y='" + shp.y + "' width='" + shp.w + "' height='" + shp.h + "' />\n";
					} else {
						//circle
						newtext += "<circle cx='" + shp.x + "' cy='" + shp.y + "' r='" + shp.r + "' />\n";
					}
				}
			}
			newtext += "</g>\n";
		}
		newtext += "</g>\n";
	}// end of optional zone shapes output

	newtext += "<g id='dots'>\n";

	//for each dot
	for(count in DOTIFY.data.circles) {
		shp = DOTIFY.data.circles[count];
		//circle
		newtext += "<circle cx='" + shp.cx + "' cy='" + shp.cy + "' r='" + shp.cr + "' fill='" + shp.f + "' />\n";
	}
	newtext += "</g>\n";

	newtext += "</svg>";

	//add svg text to textarea
	tarea.value = newtext;

	//add the newtext to a new window
	//var expWindow = window.open('','exp_window');
	//expWindow.document.open ('content-type: text/xml');
	//expWindow.focus();
	//expWindow.write(newtext);
	//expWindow.document.close();
};

//on page load assign event listeners to objects
window.onload = function() {
	//get the canvas x,y corners and width/height
	getCanvasProperties();

	//get input defaults
	getFormDefaults();

	//add event listeners to SVG objects and input elements
	setEventListeners();

	//add existing SVG shapes to dataset for editing and automated DOTIFY
	getZoneShapes();

	//add Existing SVG zone shapes to form
	setShapeForm();
};
