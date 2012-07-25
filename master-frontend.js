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
    "errorArray": [],
    "currentError":null,
    //Create an error object (not properly defined yet) and assign it to currentError
    "createErrorStub": function createErrorStub(textarea, currentError) {
	var text = textarea.value,
	selStart = textarea.selectionStart,
	selEnd = textarea.selectionEnd,
	string = text.substring(selStart,selEnd);
	currentError = currentError || {};
	if (!currentError.hasOwnProperty('type')) {
	    currentError = {'start':selStart,
			    'end':selEnd,
			    'string':string};
	}
	else if (window.confirm('Do you wish to change the current error to: ' + string +'?')){
	    currentError.start = selStart;
	    currentError.end = selEnd;
	    currentError.string = string;
	}
	this.currentError = currentError;
	this.updateCurrentErrorDisp(this.currentError);
    },
    "addTypetoError": function addTypeToError(errorType,currentError) {
	currentError.type = errorType;
	this.currentError = currentError;
	this.updateCurrentErrorDisp(currentError);
    },
    //modifies errorArray and call updateErrorList on the new array.
    //The modification consists of pushing currentError and then sorting the
    //errorArray with sortErrorArray.
    //TODO check for overlapping errors
    //TODO factor out the updating of the errorArray (push,sort)
    "addActionToErrorStub": function(action, currentError) {
	if (this.currentError === null) {
	    window.alert("No error is marked, or marked error is already added to the error list");
	    return;
	}
	currentError.action = action;
	this.errorArray.push(currentError);
	this.sortErrorArray(this.errorArray);
	this.updateErrorList(this.errorArray);
	this.updateCorrectionForm(this.errorArray);
	this.currentError = currentError = null;
	this.updateCurrentErrorDisp(currentError);
    },
    //Update the currenterror display
    "updateCurrentErrorDisp": function updateCurrentErrorDisp(currentError) {
	var dispDiv,oldDisp,newDisp,errorArr;
	dispDiv = document.getElementById("currenterror");
	oldDisp = dispDiv.firstChild;
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
    "updateErrorList":function updateErrorList(errorArray){
	var table = document.getElementById("errortable"),
	newbody = document.createElement('tbody'),
	oldbody = table.lastChild,
	i,e;
	for (i = 0; i < this.errorArray.length; i += 1) {
	    e = errorArray[i];
	    newbody.appendChild(this.createTblRow([String(i + 1),
						   e['string'],e['type'],e['action']],i));
	}
	table.replaceChild(newbody,oldbody);
    },
    //take an array of data and return a row with one cell for each item
    //if and index 'i' is given, add a delete-button at the end of the row.
    //TODO factor out the button creation code.
    "createTblRow": function createTblRow(data,i) {
	var newrow = document.createElement('tr'),j,delBtn;
	for (j = 0; j < data.length; j += 1) {
	    newrow.insertCell(-1).appendChild(
		document.createTextNode(data[j]));
	}
	if (i !== undefined) {
	    delBtn = document.createElement('button');
	    delBtn.setAttribute('name',i);
	    delBtn.setAttribute('onclick',"glob.delError(this.name,glob.errorArray);");
	    delBtn.appendChild(document.createTextNode("delete"));
	    newrow.insertCell(-1).appendChild(delBtn);
	}
	return newrow;
    },
    //replace the correction form with a new one based on errorArray, called from updateErrorList()
    "updateCorrectionForm": function updateCorrectionForm(errorArray){
	var form = document.getElementById("correctionform"),
	newForm = document.createElement('form'),
	e,p;
	newForm.setAttribute('id', 'correctionform');
	for (e = 0; e < errorArray.length; e += 1) {
	    p = document.createElement('p');
	    p.appendChild(document.createTextNode('Error ' + String(e + 1) + ":"));
	    p.appendChild(this.createLabeledInput('Correction:', e, errorArray));
	    p.appendChild(this.createLabeledInput('Comment:', e, errorArray));
	    newForm.appendChild(p);
	}
	document.getElementById("feedbackarea").replaceChild(newForm, form);
    },
    //Create form fields for corrections and comments
    "createLabeledInput": function createLabeledInput(label, index, errorArray) {
	var entry = document.createElement('label'),
	element = label.slice(0,-1).toLowerCase();
	entry.appendChild(document.createTextNode(label));
	entry.appendChild(document.createElement('input'));
	entry.lastChild.setAttribute('name', element + String(index));
	entry.lastChild.setAttribute('type','text');
	entry.lastChild.setAttribute('onKeyUp',"glob.saveInput(this);");
	if (errorArray[index][element] !== undefined) {
	    entry.lastChild.setAttribute('value', errorArray[index][element]);
	}
	return entry;
    },
    //Continually save corrections and comments to the corresponding error in errorArray
    "saveInput": function saveInput(input) {
	var attribute = input.name.slice(0,-1),
	index = input.name.slice(-1);
	this.errorArray[index][attribute] = input.value;
    },
    //Remove error at index from errorArray and updates the errorlist.
    "delError": function delError(index,errorArray) {
	errorArray.splice(index,1);
	this.errorArray = errorArray;
	this.updateErrorList(this.errorArray);
	this.updateCorrectionForm(this.errorArray);
    },
    //It's getting obvious that I need to define a proper error object.
    "sortErrorArray": function sortErrorArray(errorArray){
	return errorArray.sort(function(a,b){
				   return a["start"] - b["start"];
			       });
    }
    
};