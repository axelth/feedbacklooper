/* Author: Axel Theorin axel.theorin@gmail.com
cursor position fetching code inspired by Diego Perini
javascript.nwbox.com/cursor_position/
TODO What to do with overlapping tags?
TODO Add edit-button to errorlist
TODO Reset selection upon error creation?
TODO decrease dependence on glob.variables.  Pass in more parameters to functions.
I need to re-learn when a passed in object is modified in js.
TODO decrease coupling between html and js (pass id-attributes to functions).
Because I don't quite understand when objects are modified my current attempts att decoupling
are not going well at all
*/
var glob = {
    "name" : "glob",
    "errorArray": [],
    "currentError":null,
    "text": null,
    "prefix": null,
    "setDefaultDeadline": function setDefaultDeadline() {
	var date = new Date(),
	input = document.getElementById("date_input");
	date.setDate(date.getDate() + 14);
	input.value = [date.getFullYear(), date.getMonth() + 1,
		       date.getDate()].join("-");
    },
    //called in onload in layout.erb
    "setCompositionId": function setCompositionId(id) {
	this.compositionId = id;
    },
    "setText": function setText() {
	var textarea = (document.getElementById("originaltext") ||
			document.getElementById("styledtext"));
	this.text = textarea.textContent;
    },
    "setPrefix": function setPrefix() {
	var arr = window.location.pathname.split("/");
	if (arr[0] !== "login" || arr[0] !== "student" || arr[0] !== "teacher") {
	    this.prefix = arr[0];    
	} else {
	    this.prefix = "";
	}
    },
    "setErrorArray": function setErrorArray() {
	
	var endpoint = this.teacher ? '/teacher/compositions' : '/student/compositions',
	json = this.getJSON(endpoint,"/" + String(this.compositionId) + "/errors");
	this.errorArray = JSON.parse(json);
    },
    "setTeacher": function setTeacher(teacher) {
	this.teacher = teacher;
    },
    "compositionPageSetup": function compositionPageSetup(id,teacher) {
	this.setCompositionId(id);
	this.setText();
	this.setTeacher(teacher);
	this.setErrorArray();
	if (this.errorArray !== []) {
	    this.updateDisplay();
	}
    },
    //Create an error object (not properly defined yet) and assign it to currentError
    "createErrorStub": function createErrorStub() {
	var selection = document.getSelection().getRangeAt(0).cloneRange(),
	selStart = selection.startOffset,
	selEnd = selection.endOffset,
	string = selection.toString();
	this.currentError = this.currentError || {};
	if (!this.currentError.hasOwnProperty('type')) {
	    this.currentError = {'start':selStart,
			    'end':selEnd,
			    'string':string};
	}
	else if (window.confirm('Do you wish to change the current error to: ' + string +'?')){
	    this.currentError.start = selStart;
	    this.currentError.end = selEnd;
	    this.currentError.string = string;
	}
	this.updateCurrentErrorDisp();
    },
    "addTypetoError": function addTypeToError(errorType) {
	this.currentError.type = errorType;
	this.updateCurrentErrorDisp();
    },
    //modifies errorArray and call updateErrorList on the new array.
    //The modification consists of pushing currentError and then sorting the
    //errorArray with sortErrorArray.
    //TODO check for overlapping errors
    //TODO factor out the updating of the errorArray (push,sort)
    "addActionToErrorStub": function(action) {
	if (this.currentError === null) {
	    window.alert("No error is marked, or marked error is already added to the error list");
	    return;
	}
	this.currentError.action = action;
	this.errorArray.push(this.currentError);
	this.sortErrorArray(this.errorArray);
	this.currentError = null;
	this.updateDisplay();
    },
    "updateDisplay": function updateDisplay() {
	this.doIfElement("errortable", "updateErrorList");
	this.doIfElement("correctionform","updateCorrectionForm");
	this.doIfElement("currenterror","updateCurrentErrorDisp");
	this.styleText();
    },
    //Update the currenterror display
    "updateCurrentErrorDisp": function updateCurrentErrorDisp() {
	var currentError = this.currentError,
	dispDiv = document.getElementById("currenterror"),
	oldDisp = dispDiv.firstChild,
	errorArr, newDisp;
	if (!currentError) {
	    newDisp = document.createTextNode("none");
	    dispDiv.style.backgroundColor = "lightgreen";
	    }
	else {
	    errorArr = [(currentError['start'] || "-"),
			(currentError['end'] || "-"),
			(currentError['string'] || "-"),
			(currentError['type'] || "-"),
			(currentError['action'] || "-")];//build a data-array for createTblRow
	    newDisp = document.createElement('table');
	    newDisp.appendChild(document.createElement('tbody'));
	    newDisp.firstChild.appendChild(this.createTblRow(['start','end','string','type','action']));
	    newDisp.firstChild.appendChild(this.createTblRow(errorArr));
	    dispDiv.style.backgroundColor = "crimson";
	    }
	dispDiv.replaceChild(newDisp,oldDisp);
    },
    //Update the errorlist by constructing a new tbody from the errorArray.
    "updateErrorList":function updateErrorList(){
	var table = document.getElementById("errortable"),
	newbody = document.createElement('tbody'),
	oldbody = table.getElementsByTagName('tbody')[0],
	i,e;
	if (oldbody === undefined && this.errorArray.length === 0) {
	    return;
	}
	for (i = 0; i < this.errorArray.length; i += 1) {
	    e = this.errorArray[i];
	    newbody.appendChild(this.createTblRow([String(i + 1),
						   e['string'],e['type'],e['action']],i));
	}
	if (oldbody) {
	    table.replaceChild(newbody,oldbody);	    
	} else {
	    table.appendChild(newbody);
	}

    },
    // Cycle backwards through the error array and wrap error in span tags.
    // TODO generalize the function an allow the class to be passed in a parameter.
  "styleText": function() {
      var node = document.getElementById("styledtext"),
      text2 = "",
      startend_hsh = {},
      i,e;
      for (i = 0; i < this.errorArray.length; i += 1) {
	  e = this.errorArray[i];
	  startend_hsh[e.start] = '<span class="error">';
	  startend_hsh[e.end] = '</span>';
      }
      for (i = 0; i < this.text.length; i += 1) {
	  text2 = text2 + (startend_hsh[i] || "") + this.text[i];
      }
      node.removeChild(node.firstChild);
      document.getElementById("styledtext").innerHTML = text2;
    },
    //take an array of data and return a row with one cell for each item
    //if and index 'i' is given, add a delete-button at the end of the row.
    //TODO factor out the button creation code.
    "createTblRow": function createTblRow(data,i) {
	var newrow = document.createElement('tr'),
	j,delBtn;
	for (j = 0; j < data.length; j += 1) {
	    newrow.insertCell(-1).appendChild(
		document.createTextNode(data[j]));
	}
	if (i !== undefined && this.teacher) {
	    delBtn = document.createElement('button');
	    delBtn.setAttribute('name',i);
	    delBtn.setAttribute('onclick',"glob.delError(this.name,glob.errorArray);");
	    delBtn.appendChild(document.createTextNode("delete"));
	    newrow.insertCell(-1).appendChild(delBtn);
	}
	return newrow;
    },
    //replace the correction form with a new one based on errorArray, called from updateErrorList()
    "updateCorrectionForm": function updateCorrectionForm(){
	var form = document.getElementById("correctionform"),
	newForm = document.createElement('form'),
	errorArray = this.errorArray,
	e,p;
	newForm.setAttribute('id', 'correctionform');
	newForm.setAttribute('name', 'correctionform');
	newForm.setAttribute('action', form.getAttribute('action'));
	newForm.setAttribute('method', 'post');
	for (e = 0; e < errorArray.length; e += 1) {
	    p = document.createElement('p');
	    p.appendChild(document.createTextNode('Error ' + String(e + 1) + ":"));
	    p.appendChild(this.createLabeledInput('Correction:', e, errorArray));
	    p.appendChild(this.createLabeledInput('Comment:', e, errorArray));
	    p.appendChild(this.createHidden('start',e,errorArray));
	    p.appendChild(this.createHidden('end',e,errorArray));
	    p.appendChild(this.createHidden('type',e,errorArray));
	    p.appendChild(this.createHidden('action',e,errorArray));
	    p.appendChild(this.createHidden('string',e,errorArray));
	    newForm.appendChild(p);
	}
	document.getElementById("feedbackarea").replaceChild(newForm, form);
    },
    //Create form fields for corrections and comments
    "createLabeledInput": function createLabeledInput(label, index, errorArray) {
	var entry = document.createElement('label'),
	re = /[0-9]/,
	// use re to get the name of the label without the number
	element = label.slice(0,label.search(re)).toLowerCase();
	entry.appendChild(document.createTextNode(label));
	entry.appendChild(document.createElement('input'));
	entry.lastChild.setAttribute('name', String(index) + '[' + element + ']');
	entry.lastChild.setAttribute('type','text');
	entry.lastChild.setAttribute('onKeyUp',"glob.saveInput(this);");
	if (errorArray[index][element] !== undefined) {
	    entry.lastChild.setAttribute('value', errorArray[index][element]);
	}
	return entry;
    },
    "createHidden": function createHidden(label,index,errorArray) {
	var element = document.createElement('input');
	element.setAttribute('name', String(index) + '[' + label + ']');
	element.setAttribute('type', 'hidden');
	element.setAttribute('value', errorArray[index][label]);
	return element;
    },
    //Continually save corrections and comments to the corresponding error in errorArray
    "saveInput": function saveInput(input) {
	var name = input.name,
	attribute = name.slice(name.indexOf('[') + 1,name.indexOf(']')),
	index = input.name.slice(0,name.indexOf('['));
	this.errorArray[index][attribute] = input.value;
    },
    //Remove error at index from errorArray and updates the errorlist.
    "delError": function delError(index) {
	this.errorArray.splice(index,1);
	this.updateDisplay();
    },
    //It's getting obvious that I need to define a proper error object.
    "sortErrorArray": function sortErrorArray(errorArray){
	return errorArray.sort(function(a,b){
				   return a["start"] - b["start"];
			       });
    },
   
    "getJSON": function getJSON(endpoint, identifier) {
	var req = new XMLHttpRequest(),
	response;
	req.onreadystatechange = function(response) {
	  if (req.readyState === 4) {
	      if (req.status === 200 || req.status === 304) {
		  response = req.responseText;
	      }
	  }
	};
	req.open("GET",this.prefix + endpoint + identifier, false);
	req.send(null);
	return req.response;
    },
    "postErrorArray": function postErrorArray(errorArray) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", "/feedback/" + this.compositionId);
	xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xmlhttp.send(JSON.stringify(errorArray));
	},
    "elementThere": function elementThere(name) {
	return Boolean(document.getElementById(name));
    },
    "doIfElement": function doIfElement(eltid, func) {
	if (document.getElementById(eltid)) {
	    this[func]();	    
	}
    }
};